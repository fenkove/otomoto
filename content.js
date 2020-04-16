// Helpers
function getElementByXpath(path) {
	return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getIntValue(source, element) {
	return parseInt(source.split(element)[1].match(/\d+/)[0]);
}

function getStringValue(source, element) {
	return String(source.split(element)[2].match(/[a-z]+/)[0]);
}

function getCurrencyRate(currency1, currency2) {
	var http = new XMLHttpRequest();
	http.open("GET", "https://api.exchangeratesapi.io/latest?base="+currency1+"&symbols="+currency2, false);
	http.send();
	return JSON.parse(http.responseText).rates[currency2];
}

// Getting vehicle data
var json_str = getElementByXpath("//*[contains(text(),'GPT.targeting')]").textContent;

const price_pln = getIntValue(json_str, "price_raw");
const year = getIntValue(json_str, "year");
const capacity = getIntValue(json_str, "capacity");
const fuel_type = getStringValue(json_str, "fuel_type");

// Tax calculation
const customPercent = 0.055;
const currentYear = new Date().getFullYear();
const exciseFuelKoef = (fuel_type == 'diesel') ? 75 : 50;
const maxYearKoef = 15;
const taxPercent = 0.2;

function getYearKoef(year){
	if ((currentYear-year) > maxYearKoef) {
		return maxYearKoef;
	} else {
		return currentYear-year;
	}
}

function getCustomValue(price){
	return price*customPercent;
}

function getExciseValue(capacity, year){
	return exciseFuelKoef * (capacity/1000) * getYearKoef(year);
}

function getTaxValue(price){
	return price*taxPercent;
}

var price_eur = price_pln * getCurrencyRate("PLN","EUR");

var total_price_eur_without_tax = price_eur + getCustomValue(price_eur) + getExciseValue(capacity, year);
var total_price_eur = total_price_eur_without_tax + getTaxValue(total_price_eur_without_tax);

var total_price_usd = total_price_eur * getCurrencyRate("EUR","USD");

//Sending data to popup.js
chrome.runtime.sendMessage({
  from: 'content',
  subject: 'showPageAction',
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {
	var domInfo = {
      total_price_eur: Math.round(total_price_eur),
	  total_price_usd: Math.round(total_price_usd),
      initial_price_eur: Math.round(price_eur),
      custom_value: Math.round(getCustomValue(price_eur)),
	  excise_value: Math.round(getExciseValue(capacity, year)),
	  tax: Math.round(getTaxValue(total_price_eur_without_tax))
    };
    response(domInfo);
  }
});
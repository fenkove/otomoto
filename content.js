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

function getExciseBaseRate(type, capacity){
	if (type == "petrol"){
		return (capacity < 3000) ? 50 : 100;
	}
	else {
		return (capacity < 3500) ? 75 : 150;
	}
}


function getYearKoef(year){
	if ((currentYear-year) > maxYearKoef) {
		return maxYearKoef;
	} else {
		return currentYear-year;
	}
}

function getCustomValue(price, fuel_type){
	return (fuel_type != 'electric') ? price*customPercent : 0;
}

function getExciseValue(capacity, year, fuel_type){
	return (fuel_type == 'hybrid' || fuel_type == 'electric') ? hybrid_electro_excise : (getExciseBaseRate(fuel_type,capacity) * (capacity/1000) * getYearKoef(year));
}

function getTaxValue(price, fuel_type){
	return (fuel_type != 'electric') ? price*taxPercent : 0;
}

// Getting vehicle data
var json_str = getElementByXpath("//*[contains(text(),'GPT.targeting')]").textContent;

const price_pln = getIntValue(json_str, "price_raw");
const year = getIntValue(json_str, "year");
const fuel_type = getStringValue(json_str, "fuel_type");
const capacity = (fuel_type == 'electric') ? 0 : getIntValue(json_str, "capacity");

// Tax calculation
const customPercent = (fuel_type == "hybrid") ? 0.1 : 0.055;
const currentYear = new Date().getFullYear();
const maxYearKoef = 15;
const taxPercent = 0.2;
const hybrid_electro_excise = 100;

var price_eur = price_pln * getCurrencyRate("PLN","EUR");
var custom_value = getCustomValue(price_eur, fuel_type);
var excise_value = getExciseValue(capacity, year, fuel_type); 
var total_price_eur_without_tax = price_eur + custom_value + excise_value;
var tax_value = getTaxValue(total_price_eur_without_tax, fuel_type);
var total_price_eur = total_price_eur_without_tax + tax_value;
var total_price_usd = total_price_eur * getCurrencyRate("EUR","USD");
var isElectric = (fuel_type == 'electric');

//Sending data to popup.js
chrome.runtime.sendMessage({
  from: 'content',
  subject: 'showPageAction',
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {
	var domInfo = {
      total_price_eur: (isElectric) ? "~"+Math.round(total_price_eur) : Math.round(total_price_eur),
	  total_price_usd: (isElectric) ? "~"+Math.round(total_price_usd) : Math.round(total_price_usd),
      initial_price_eur: Math.round(price_eur),
      custom_value: Math.round(custom_value),
	  excise_value: (isElectric) ? "до "+excise_value : Math.round(excise_value),
	  tax: Math.round(tax_value)
    };
    response(domInfo);
  }
});
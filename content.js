function getElementByXpath(path) {
	return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getIntValue(source, element) {
	return parseInt(source.split(element)[1].match(/\d+/)[0]);
}

//GET VALUE PARSING HTML
//var price_string_pln = getElementByXpath("//*[@class='offer-price__number']/text()");
//var price_pln = parseInt(String(price_string_pln.textContent).replace(/ /g, ''), 10);
//console.log("price_pln: " + price_pln);

var json_str = getElementByXpath("//*[contains(text(),'GPT.targeting')]").textContent;

const price_pln = getIntValue(json_str, "price_raw");
const year = getIntValue(json_str, "year");
const capacity = getIntValue(json_str, "capacity");

// FORMULA
function getYearKoef(year){
	if ((2020-year) > 15) {
		return 15;
	} else {
		return 2020-year;
	}
}

function getCustomValue(price){
	return price*0.055;
}

function getExciseValue(capacity, year){
	return 50 * (capacity/1000) * getYearKoef(year)
}

function getTaxValue(price){
	return price*0.2;
}

const price_eur = price_pln / 4.55;

var total_price_eur_without_tax = price_eur + getCustomValue(price_eur) + getExciseValue(capacity, year);
var total_price_eur = total_price_eur_without_tax + getTaxValue(total_price_eur_without_tax);
console.log(total_price_eur)

chrome.runtime.sendMessage({
  from: 'content',
  subject: 'showPageAction',
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {
	var domInfo = {
      total_price_eur: Math.round(total_price_eur),
      initial_price_eur: Math.round(price_eur),
      custom_value: Math.round(getCustomValue(price_eur)),
	  excise_value: Math.round(getExciseValue(capacity, year)),
	  tax: Math.round(getTaxValue(total_price_eur_without_tax))
    };
    response(domInfo);
  }
});
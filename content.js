console.log("Logging Content.js");

let par = document.getElementsByClassName('offer-price__number');
for (el of par) {
	el.style['background-color'] = '#FF00FF';
}
console.log(par[0].textContent);

let params = document.getElementsByClassName('offer-params__value');
params[6].style['background-color'] = '#FF00FF';
params[8].style['background-color'] = '#FF00FF';

var text1 = par[0].textContent;
var text2 = params[6].textContent;
var text3 = params[8].textContent;

var price0 = parseInt(text1.match(/\d+/g).map(Number)[0])
var price1 = parseInt(text1.match(/\d+/g).map(Number)[1])
var rik = parseInt(text2.match(/\d+/),10)
var obem0 = parseInt(text3.match(/\d+/g).map(Number)[0])
var obem1 = parseInt(text3.match(/\d+/g).map(Number)[1])

console.log()
console.log(rik)

var obem_final = (obem0*1000)+obem1

var k_rik = 1

if ((2020-rik) > 15) {
	k_rik = 15;
} else {
	k_rik = 2020-rik;
}

var price_eur = ((price0*1000)+price1)/4.55

var aktsyz = 50 * (obem_final/1000) * k_rik
var final_price = (price_eur + price_eur*0.055 + aktsyz)*1.2
console.log(final_price)

chrome.runtime.sendMessage({
  from: 'content',
  subject: 'showPageAction',
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {
	var domInfo = Math.round(final_price)
    response(domInfo);
  }
});
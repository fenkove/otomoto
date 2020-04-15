const setDOMInfo = info => {
  document.getElementById('total').textContent = info.total_price_eur;
  document.getElementById('total_usd').textContent = info.total_price_usd;
  document.getElementById('initial_price_eur').textContent = info.initial_price_eur;
  document.getElementById('custom').textContent = info.custom_value;
  document.getElementById('excise').textContent = info.excise_value;
  document.getElementById('tax').textContent = info.tax;
};

window.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'popup', subject: 'DOMInfo'},
        setDOMInfo);
  });
});
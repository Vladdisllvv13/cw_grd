// Находим элементы блока с выбором типа товара и блока с одеждой
const menuMobile = document.getElementById('menuMobile');
const desktopMenu = document.getElementById('desktopMenu');
const desktopFooter = document.getElementById('desktopFooter');

// Отслеживаем событие прокрутки страницы и изменения размеров окна
window.addEventListener('scroll', function() {
  adjustTabsNavigationPosition();
});

window.addEventListener('resize', function() {
  adjustTabsNavigationPosition();
});
window.addEventListener('load', function() {
  showDeviceMenu();
});


function adjustTabsNavigationPosition() {
  const screenWidth = window.innerWidth;

  if (screenWidth > 740) { // Примерная ширина для планшетов и десктопов, подберите подходящее значение
      menuMobile.hidden = true;
      desktopMenu.hidden = false;
      desktopFooter.hidden = false;
  } else {
      menuMobile.hidden = false;
      desktopMenu.hidden = true;
      desktopFooter.hidden = true;
  }
}

function showDeviceMenu(){
  const screenWidth = window.innerWidth;
  if(screenWidth > 740) {
    menuMobile.hidden = true;
    desktopMenu.hidden = false;
    desktopFooter.hidden = false;
  }
  else {
    menuMobile.hidden = false;
    desktopMenu.hidden = true;
    desktopFooter.hidden = true;
  }
}

async function main(){
  showDeviceMenu();
}

main()
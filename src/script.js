// import * as THREE from 'three';
// import TWEEN from 'three/examples/jsm/libs/tween.module';
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
// import init from './init';
// import './init.css';

// Получите идентификатор пользователя из локального хранилища
async function getUserId() {
  try {
    const userId = localStorage.getItem('userId');
    if (userId === null) {
      return 'ALL';
    } else {
      return userId;
    }
  } catch (error) {
    return 'ALL';
  }
}

const toCatalogButton = document.getElementById('toCatalogButton');
toCatalogButton.addEventListener('click', function() {
  window.location.href = 'catalog.html';
});

const toWardrobeButton = document.getElementById('toWardrobeButton');
toWardrobeButton.addEventListener('click', function() {
  window.location.href = 'garderob.html';
});

const toAuthButton = document.getElementById('toAuthButton');
toAuthButton.addEventListener('click', function() {
  window.location.href = 'auth.html';
});

const authButton = document.getElementById('authButton');
authButton.addEventListener('click', function() {
  window.location.href = 'auth.html';
});

const favouritesSection = document.getElementById('favouritesSection');


const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', async function() {
  localStorage.setItem('userId', 'ALL');
  exitButton.style.display = 'none';
  location.reload();
});

async function main() {
  const userId = await getUserId();
  if (userId !== 'ALL') {
    exitButton.style.display = 'inline-flex';
    favouritesSection.hidden = false;
  } else {
    exitButton.style.display = 'none';
    favouritesSection.hidden = true;
  }
}

main();
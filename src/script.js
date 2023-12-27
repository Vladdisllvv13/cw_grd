// import * as THREE from 'three';
// import TWEEN from 'three/examples/jsm/libs/tween.module';
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
// import init from './init';
// import './init.css';

// Получите идентификатор пользователя из локального хранилища
async function getUserId(){
    try{
      const userId = localStorage.getItem('userId');
      if(userId === null){
        return 'ALL'
      }else return userId;
    }
    catch(error){
      return "ALL"
    }
  }

const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function() {
    localStorage.setItem('userId', 'ALL');
    alert('Вы успешно вышли из системы');
    exitButton.hidden = true;
    location.reload();
});

const userId = getUserId()
if(userId !== 'ALL'){
    exitButton.hidden = false;
}

import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import init from './init';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import './garderob.css';

const { sizes, camera, scene, canvas, controls, renderer, stats, gui } = init();

let tshirtCounter = 0;
let coatCounter = 0;
let pantsCounter = 0;
let hatCounter = 0;

let tshirtId = 0;
let coatId = 0;
let pantsId = 0;
let hatId = 0;

let isMale = true;
let isFemale = false;

let isClothes = true;
let isStyles = false;

// Получите идентификатор пользователя из локального хранилища
async function getUserId(){
  try{
    const userId = localStorage.getItem('userId');
    if(userId === null){
      
      return 'ALL'
    }
    else return userId;
  }
  catch(error){
    return "ALL"
  }
}


const firebaseConfig = {
    apiKey: "AIzaSyAgfHpqhm8BYiQTE30cusEJMC4uK8lTPis",
    authDomain: "virt-shop.firebaseapp.com",
    projectId: "virt-shop",
    storageBucket: "virt-shop.appspot.com",
    messagingSenderId: "72126462317",
    appId: "1:72126462317:web:1eb5af9da767369cf84264",
    measurementId: "G-ZS4NNVK5K5"
  };
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const clothesCollection = collection(db, 'clothes');
const clothesSnapshot = await getDocs(clothesCollection);
const clothesData = [];
let userClothesData = [];

let userStylesData = [];

const userId = await getUserId()
if(userId === "ALL"){
  Swal.fire({
    icon: "info",
    title: "Вы не вошли в систему, поэтому будет предоставлена вся одежда",
  });
}


//Получаем данные об одежде и записываем в clothesData
clothesSnapshot.forEach((document) => {
  const data = document.data();
  const sizeRefs = data.idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));
  const nameRef = doc(clothesCollection, document.id);
  const imageRef = doc(clothesCollection, document.id);
  const modelRef = doc(clothesCollection, document.id);
  const clothTypeRef = doc(db, 'clothType', data.idClothType.toString());
  const clothTypeGenderRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());
  const colorsRef = data.idColors.map((colorId) => doc(db, 'colors', colorId.toString()));
  clothesData.push({
    sizeRefs,
    nameRef,
    imageRef,
    clothTypeRef,
    modelRef,
    colorsRef,
    clothTypeGenderRef
  });
});



//Пол
async function addFloor(){
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(60,60,2),
        new THREE.MeshStandardMaterial({
            color: '#444444',
            metalness: 0,
            roughness: 0.5,
        }),
    );
    floor.position.set(0, -0.9, 0);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI * 0.5;
    scene.add(floor);
}

//Текстуры
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/textures/fabric2/fabric_130_roughness-1K.png');
    const texture1 = textureLoader.load('/textures/tkan2/fabric_138_basecolor-1K.png');
    const texture2 = textureLoader.load('/textures/tkan2/fabric_138_roughness-1K.png');
    const texture3 = textureLoader.load('/textures/fabric2/fabric_130_albedo-1K.png');
    const texture4 = textureLoader.load('/textures/fabric1/Fabric_037_basecolor.jpg');
    const texture5 = textureLoader.load('/textures/fabric2/fabric_130_ambientocclusion-1K.png');

//Материал
function setMaterial(currentColor, currentMetalness, currentRoughness, currentMap){
    return new THREE.MeshStandardMaterial({
        color: currentColor,
        metalness: currentMetalness,
        roughness: currentRoughness,
        map: texture5
    });
}

//Свет
async function addLights(){
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(100, 100, 100);
    dirLight.target.position.set(75, 20, 0);
    dirLight.castShadow = true;
    dirLight.shadow.bias = -0.01;
    dirLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
    scene.add(dirLight);
}

//Загрузка модели
function loadMannequin(){
    const mannequinObject = scene.getObjectByName('mannequin');
    scene.remove(mannequinObject);
    let path = null;
    if(isMale) path = './3DModels/male/mannequinMale.glb';
    else if(isFemale) path = './3DModels/female/mannequinFemale.glb';
    const loader = new GLTFLoader();
    loader.load(
        path,
        (gltf) => {
            console.log('success');
            console.log(gltf);
            const mannequin = gltf.scene.children[0];
            scene.add(mannequin);
            mannequin.name = 'mannequin';
        },
        (progress) => {
            // console.log('progess');
            // console.log(progress);
        },
        (error) => {
            console.log('error');
            console.log(error);
        },
    );
}
function loadCloth(modelName, clothType, clothId, firstColor){
  const loader = new GLTFLoader();
  loader.load(
      `./3DModels/clothes/${modelName}.glb`,
      (gltf) => {
          console.log('success');
          console.log(gltf);
          const cloth = gltf.scene.children[0];
          cloth.scale.set(10,10,10);
          
          
          
          if (clothType == "Футболка" || clothType == "Топ" || clothType == "Майка"){
            tshirtCounter += 1;
            tshirtId = clothId;
            cloth.name = "clothType2";
          }
          if (clothType == "Кофта"){
            coatCounter += 1;
            coatId = clothId;
            cloth.name = "clothType3";
          }
          if (clothType == "Брюки" || clothType == "Шорты" || clothType == "Юбка"){
            pantsCounter += 1;
            pantsId = clothId;
            cloth.name = "clothType4";
          }
          if (clothType == "Шапка" || clothType == "Кепка" || clothType == "Шляпа"){
            hatCounter += 1;
            hatId = clothId;
            cloth.name = "clothType1";
          }
          scene.add(cloth);
          setColor(clothType, firstColor);
      },
      (progress) => {
          // console.log('progess');
          // console.log(progress);
      },
      (error) => {
          console.log('error');
          console.log(error);
      },
  );
}

function setColor(clothType, color){
  let clothObject;
  console.log(clothType);
  if (clothType == "Шапка" || clothType == "Кепка" || clothType == "Шляпа") clothObject = scene.getObjectByName("clothType1");
  else if (clothType == "Футболка" || clothType == "Топ" || clothType == "Майка") clothObject = scene.getObjectByName("clothType2");
  else if (clothType == "Кофта") clothObject = scene.getObjectByName("clothType3");
  else if (clothType == "Брюки" || clothType == "Шорты" || clothType == "Юбка") clothObject = scene.getObjectByName("clothType4");
  console.log(clothObject);
  clothObject.material = setMaterial(color, 0, 0.4);
}

//Анимация
const clock = new THREE.Clock();
const tick = () => {
    //stats.begin();
    controls.update();
    const delta = clock.getDelta();



    TWEEN.update();
    renderer.render(scene, camera);
    //stats.end();
    window.requestAnimationFrame(tick);
};





const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function() {
    localStorage.setItem('userId', 'ALL');
    exitButton.hidden = true;
    location.reload();

});



async function saveStyle(){
  let styleClothes = [];
  if(userId === "ALL"){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя создать стиль для незарегистрированного пользователя!",
    });
    return;
  }
  try{
    if(tshirtCounter === 1 || coatCounter === 1 || pantsCounter === 1 || hatCounter === 1){
      if(tshirtId != 0){
        styleClothes.push(parseInt(tshirtId));
      }
      if(coatId != 0){
        styleClothes.push(parseInt(coatId));
      }
      if(pantsId != 0){
        styleClothes.push(parseInt(pantsId));
      }
      if(hatId != 0){
        styleClothes.push(parseInt(hatId));
      }
    }
    console.log(styleClothes);
  
    let styleHtml = `
      <div>Наименование</div>
      <input type="text" id="Name" class="swal2-input" placeholder="Наименование" value="" required>
      <div>Описание</div>
      <input type="text" id="Description" class="swal2-input" placeholder="Описание" value="" required>
    `;
  
    // Отображение модального окна с формой для ввода данных и предварительно заполненными значениями
    Swal.fire({
      title: 'Добавление стиля',
      html: styleHtml,
      showCancelButton: true,
      confirmButtonText: 'Сохранить',
      cancelButtonText: 'Отмена',
      focusConfirm: false,
      preConfirm: async () => {
        const selectedName = document.getElementById('Name').value;
        const selectedDescription = document.getElementById('Description').value;
        return { selectedName, selectedDescription };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        let gender = null;
        const selectedName = result.value.selectedName;
        const selectedDescription = result.value.selectedDescription;

        if(selectedName.trim() === '' || selectedDescription.trim() === ''){
          Swal.fire({
            icon: "error",
            title: "Упс...",
            text: "Вы не заполнили обязательные поля!",
          });
        }
        else{
          if(isMale) gender = 'Мужской'
          else if(isFemale) gender = 'Женский'
    
          const newStyle = {
            name: selectedName,
            description: selectedDescription,
            idClothes: styleClothes,
            idUser: userId,
            styleGender: gender
          };
    
          const stylesCollection = collection(db, 'styles');
          await addDoc(stylesCollection, newStyle);
          getStyles();
          Swal.fire({
            icon: "success",
            title: "Информация сохранена!",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(function() {
          }, 2000);
        }
      }
    });
  }
  catch (error) {
    console.error("Error adding style:", error);
  }
}

const saveStyleContainer = document.getElementById('saveStyleContainer');
const saveStyleButton = document.getElementById('saveStyleButton');
saveStyleButton.addEventListener('click', function() {
  saveStyle();
});



const favouritesSection = document.getElementById('favouritesSection');
// Получаем данные о пользователе
const userCollection = collection(db, 'users');

if(userId !== 'ALL'){
  exitButton.hidden = false;
  favouritesSection.hidden = false;
}

const userSnapshot = await getDoc(doc(userCollection, `${userId}`)); // Замените '1' на идентификатор пользователя, для которого вы хотите отобразить одежду
const userData = userSnapshot.data();
const userGender = userData.gender;
if(userGender === "Женский"){
  isMale = false;
  isFemale = true;
}

// Преобразуем идентификаторы в строковый формат
const userWardrobeClothesIds = userData.idWardrobeClothes.map(String);
// Фильтруем данные об одежде по идентификаторам из коллекции clothes
userClothesData = clothesData.filter((cloth) => userWardrobeClothesIds.includes(cloth.nameRef.id));
console.log(userClothesData);

//Создаем ClothData
async function createClothBlock(data, list) {
  try {
    let isFavourite = false;
    const clothesList = document.getElementById(list);
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "p-4 flex flex-shrink-0 justify-center items-center mb-4";
    clothesBlock.classList.add('inline-flex');
    clothesBlock.innerHTML = `
      <div class="imageContainerClothesOne720x400 bg-gray-100 p-6 rounded-lg border border-gray-950 shadow hover:shadow-lg">
        <img class="object-scale-down h-40 rounded w-40 object-center mb-6" src="" alt="content">
        <h3 class="sizesOne tracking-widest text-purple-500 text-xs font-medium title-font"></h3>
        <h1 class="headingOne text-lg text-gray-900 font-medium title-font"></h4>
        <div class="flex items-end mb-4">
          <h5 class="headingTwo text-lg text-gray-900 font-medium title-font"></h5>
          <svg class="h-8 w-8 fill-current text-gray-500 hover:text-black ml-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path id="heartIcon" d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#4f4f4f"/>
          </svg>
        </div>
        <div class="colorsOne flex mb-4"></div>
        <div class="flex items-stretch">
        <button id="addToSceneButton" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-r rounded-l mr-2">
        Надеть
        </button>
        <button id="deleteClothButton" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-r rounded-l" hidden>
        Удалить
        </button>
        </div>
      </div>`;
    clothesList.appendChild(clothesBlock);
    const clothTypeElement = clothesBlock.querySelector('.headingOne');
    const nameElement = clothesBlock.querySelector('.headingTwo');
    const sizesElement = clothesBlock.querySelector('.sizesOne');
    const imageElement = clothesBlock.querySelector('.imageContainerClothesOne720x400 img'); 
    const colorsElement = clothesBlock.querySelector('.colorsOne');

    if (clothTypeElement && nameElement && sizesElement && imageElement && colorsElement) {
      const clothTypeSnapshot = await getDoc(data.clothTypeRef);
      const clothTypeValue = clothTypeSnapshot.data().name;
      const nameSnapshot = await getDoc(data.nameRef); // Fetch the document snapshot
      const sizeSnapshots = await Promise.all(data.sizeRefs.map((sizeRef) => getDoc(sizeRef)));
      const sizeValues = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name).join(', ');
      const colorsSnapshots = await Promise.all(data.colorsRef.map((colorRef) => getDoc(colorRef)));
      const colorsValues = colorsSnapshots.map((colorSnapshot) => colorSnapshot.data().hexColor).join(', ');

      const imagePathSnapshot = await getDoc(data.imageRef);
      const imagePath = imagePathSnapshot.data().image;
      if (imagePath) {
        const storageImageRef = ref(storage, `images/${imagePath}.jpg`);
        const imageUrl = await getDownloadURL(storageImageRef);
        imageElement.src = imageUrl;
      }
      clothTypeElement.textContent = clothTypeValue;
      nameElement.textContent = nameSnapshot.data().name; // Access the data from the snapshot
      sizesElement.textContent = sizeValues;

      // Create color circles
      colorsValues.split(',').forEach((color) => {
        const colorCircle = document.createElement('div');
        colorCircle.className = 'colorCircle';
        colorCircle.style.backgroundColor = color.trim();
        colorsElement.appendChild(colorCircle);
      });

      if(userId !== 'ALL'){
        const userDoc = doc(userCollection, userId);

      // Получаем текущие данные пользователя
      getDoc(userDoc).then((userDocSnapshot) => {
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          let favouritesClothesIds = userData.idFavourites || [];

          // Преобразуем идентификатор одежды в числовой формат
          const clothIdNumber = parseInt(data.nameRef.id, 10);

          // Проверяем, содержит ли массив уже выбранный идентификатор одежды
          if (favouritesClothesIds.includes(clothIdNumber)) {
            isFavourite = true;
            const heartIcon = clothesBlock.querySelector('#heartIcon');
            heartIcon.classList.add('filled-heart');
            console.log(`${data.nameRef.id} в избранном`);
          }
        }})
      }

      const addToSceneButton = clothesBlock.querySelector('#addToSceneButton');
      addToSceneButton.addEventListener('click', () => {
      addToScene(data);
      });

      const deleteClothButton = clothesBlock.querySelector('#deleteClothButton');
      if(userId !== 'ALL' && list !== 'garderobStylesList'){
        deleteClothButton.hidden = false;
        deleteClothButton.addEventListener('click', () => {
          const clothId = data.nameRef.id;
          deleteCloth(clothId);
          });
      }

      const heartIcon = clothesBlock.querySelector('#heartIcon') 
      heartIcon.addEventListener('click', () => {
        heartIcon.classList.toggle('filled-heart');
        if(userId !== 'ALL'){
          if(!isFavourite){
            addToFavourites(data.nameRef.id);
            isFavourite = true;
          } 
          else if(isFavourite){
            removeFromFavourites(data.nameRef.id);
            isFavourite = false;
          } 
        }
      });
    }
  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

// Обработчик события для кнопки "to wardrobe"
async function addToFavourites(clothId) {
  const userCollection = collection(db, 'users');
  const userId = await getUserId();
  console.log(userId);
  if(userId === 'ALL'){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя добавить одежду в избранное для незарегистрированного пользователя",
    });
    return;
  }
  const userDoc = doc(userCollection, userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];

      // Преобразуем идентификатор одежды в числовой формат
      const clothIdNumber = parseInt(clothId, 10);

      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!favouritesClothesIds.includes(clothIdNumber)) {
        // Добавляем идентификатор одежды к массиву
        favouritesClothesIds.push(clothIdNumber);

        // Обновляем данные пользователя в базе данных
        updateDoc(userDoc, { idFavourites: favouritesClothesIds }).then(() => {
          Swal.fire({
            icon: "success",
            title: "Одежда добавлена в избранное!",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(function() {
          }, 2000);
        }).catch((error) => {
          console.error('Error updating user data:', error);
        });
      }
    }
  }).catch((error) => {
    console.error('Error fetching user data:', error);
  });
}

async function removeFromFavourites(clothId){
  try {
    const userCollection = collection(db, 'users');
    const userDoc = doc(userCollection, userId);

    // Retrieve the user document
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];

      // Remove the selected cloth's ID from the wardrobeClothesIds array
      const clothIdNumber = parseInt(clothId, 10);
      console.log(clothIdNumber);
      favouritesClothesIds = favouritesClothesIds.filter((id) => id !== clothIdNumber);

      // Update the user document with the modified wardrobeClothesIds array
      await updateDoc(userDoc, { idFavourites: favouritesClothesIds });

      // Optional: You can also update the UI to reflect the deletion
      // For example, remove the deleted cloth from the DOM

      Swal.fire({
        icon: "success",
        title: "Одежда удалена из избранного!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(function() {
      }, 2000);
    }
  } catch (error) {
    console.error('Error deleting cloth:', error);
  }
}

async function deleteCloth(clothId){
  try {
    const userDoc = doc(userCollection, userId);

    // Retrieve the user document
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let wardrobeClothesIds = userData.idWardrobeClothes || [];

      // Remove the selected cloth's ID from the wardrobeClothesIds array
      const clothIdNumber = parseInt(clothId, 10);
      console.log(clothIdNumber);
      wardrobeClothesIds = wardrobeClothesIds.filter((id) => id !== clothIdNumber);

      // Update the user document with the modified wardrobeClothesIds array
      await updateDoc(userDoc, { idWardrobeClothes: wardrobeClothesIds });

      // Optional: You can also update the UI to reflect the deletion
      // For example, remove the deleted cloth from the DOM

      Swal.fire({
        icon: "success",
        title: "Одежда удалена из гардероба!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(function() {
        location.reload();
      }, 2000);
    }
  } catch (error) {
    console.error('Error deleting cloth:', error);
  }
}

//Удаление со сцены одежды
async function removeFromScene(clothType){
  try{
    let block = null;
    let imageElement = null;
    let nameElement = null;
    let imagePath = null;
    let colorsContainer = null;

    console.log(clothType);
    let clothObject;
    

    if (clothType == "Шапка" || clothType == "Кепка" || clothType == "Шляпа"){
      block = document.getElementById('HatBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');
      const removeButton = block.querySelector('#removeButton');
      colorsContainer = block.querySelector('.colorsContainer');
      imagePath = "images/shapka.png";
      removeButton.hidden = true;
      if (colorsContainer) {
        colorsContainer.remove(); // Удаление контейнера с кнопками-кружочками цветов
      }
      clothObject = scene.getObjectByName("clothType1");
      hatCounter = 0;
      hatId = 0;
    }
    else if (clothType == "Футболка" || clothType == "Топ" || clothType == "Майка"){
      block = document.getElementById('TshirtBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');
      const removeButton = block.querySelector('#removeButton');
      colorsContainer = block.querySelector('.colorsContainer');
      imagePath = "images/tshirt.png";
      removeButton.hidden = true;
      if (colorsContainer) {
        colorsContainer.remove(); // Удаление контейнера с кнопками-кружочками цветов
      }
      clothObject = scene.getObjectByName("clothType2");
      tshirtCounter = 0;
      tshirtId = 0;
    }
    else if (clothType == "Кофта"){
      block = document.getElementById('CoatBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');
      const removeButton = block.querySelector('#removeButton');
      colorsContainer = block.querySelector('.colorsContainer');
      imagePath = "images/hudi.png";
      removeButton.hidden = true;
      if (colorsContainer) {
        colorsContainer.remove(); // Удаление контейнера с кнопками-кружочками цветов
      }
      clothObject = scene.getObjectByName("clothType3");
      coatCounter = 0;
      coatId = 0;
    }
    else if (clothType == "Брюки" || clothType == "Шорты" || clothType == "Юбка"){
      block = document.getElementById('PantsBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');
      const removeButton = block.querySelector('#removeButton');
      colorsContainer = block.querySelector('.colorsContainer');
      imagePath = "images/shtani.png";
      removeButton.hidden = true;
      if (colorsContainer) {
        colorsContainer.remove(); // Удаление контейнера с кнопками-кружочками цветов
      }
      clothObject = scene.getObjectByName("clothType4");
      pantsCounter = 0;
      pantsId = 0;
    }

    scene.remove(clothObject);
    nameElement.textContent = '';
    imageElement.src = imagePath;

    if(tshirtCounter === 0 && coatCounter === 0 && pantsCounter === 0 && hatCounter === 0){
      saveStyleContainer.style.display = 'none';
      console.log('я спрятан');
    }
    
    
  }catch (error) {
    console.error("Ошибка при удалении одежды:", error);
  }
}
//Добавление одежды на сцену
async function addToScene(data) {
  try {
    let block = null;
    let imageElement = null;
    let nameElement = null;
    let colorsContainer = null;
    // Получаем данные об одежде
    const clothTypeSnapshot = await getDoc(data.clothTypeRef);
    const clothTypeValue = clothTypeSnapshot.data().name;
    const colorsSnapshots = await Promise.all(data.colorsRef.map((colorRef) => getDoc(colorRef)));
    const colorsValues = colorsSnapshots.map((colorSnapshot) => colorSnapshot.data().hexColor).join(', ');

    if (clothTypeValue == "Шапка" || clothTypeValue == "Кепка" || clothTypeValue == "Шляпа"){
      block = document.getElementById('HatBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');

      const removeButton = block.querySelector('#removeButton');
      if(hatCounter != 0){
        removeFromScene(clothTypeValue);
      }
      removeButton.hidden = false;
      removeButton.addEventListener('click', () => {
        removeFromScene(clothTypeValue);
      });
    }
    else if (clothTypeValue == "Футболка" || clothTypeValue == "Топ" || clothTypeValue == "Майка"){
      block = document.getElementById('TshirtBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');

      const removeButton = block.querySelector('#removeButton');
      if(tshirtCounter != 0){
        removeFromScene(clothTypeValue);
      }
      removeButton.hidden = false;
      removeButton.addEventListener('click', () => {
        removeFromScene(clothTypeValue);
      });
    }
    else if (clothTypeValue == "Кофта"){
      block = document.getElementById('CoatBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');

      const removeButton = block.querySelector('#removeButton');
      if(coatCounter != 0){
        removeFromScene(clothTypeValue);
      }
      removeButton.hidden = false;
      removeButton.addEventListener('click', () => {
        removeFromScene(clothTypeValue);
      });
    }
    else if (clothTypeValue == "Брюки" || clothTypeValue == "Шорты" || clothTypeValue == "Юбка"){
      block = document.getElementById('PantsBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');

      const removeButton = block.querySelector('#removeButton');
      if(pantsCounter != 0){
        removeFromScene(clothTypeValue);
      }
      removeButton.hidden = false;
      removeButton.addEventListener('click', () => {
        removeFromScene(clothTypeValue);
      });
      
    }

    // Показ элемента
    saveStyleContainer.style.display = 'block';

    colorsContainer = document.createElement('div');
    colorsContainer.className = 'colorsContainer mt-4';
    block.appendChild(colorsContainer);

    let firstColor;
    let isFirst = true;

    colorsValues.split(',').forEach((color) => {
      const colorButton = document.createElement('button');
      colorButton.className = 'colorButton shadow hover:shadow-lg';
      colorButton.style.backgroundColor = color.trim();
      colorsContainer.appendChild(colorButton);

      if(isFirst) firstColor = color.trim();

      colorButton.addEventListener('click', () => {
        setColor(clothTypeValue, color.trim());
        console.log(color);
      });
      isFirst = false;
    });

    const nameSnapshot = await getDoc(data.nameRef);
    const nameValue = nameSnapshot.data().name;
    const imagePathSnapshot = await getDoc(data.imageRef);
    const imagePath = imagePathSnapshot.data().image;


    // Обновляем содержимое блока
    if (imageElement && nameElement && colorsContainer) {
      if (imagePath) {
        const storageImageRef = ref(storage, `images/${imagePath}.jpg`);
        const imageUrl = await getDownloadURL(storageImageRef);
        imageElement.src = imageUrl;
      }
      nameElement.textContent = nameValue;

      const modelSnapshot = await getDoc(data.modelRef);
      const modelName = modelSnapshot.data().model;
      console.log(modelName);
      loadCloth(modelName, clothTypeValue, data.nameRef.id, firstColor);
      console.log(firstColor);
    }
  } catch (error) {
    console.error("Ошибка при добавлении одежды:", error);
  }
}

//Рендерим все найденное
async function renderClothes(clothes) {
  const clothesList = document.getElementById('garderobClothesList');
  clothesList.innerHTML = ''; // Очищаем лист

  clothes.forEach((data) => {
    createClothBlock(data, 'garderobClothesList');
  });
}
//Проверяем комбобоксы и поиск
async function handleSearchAndFilter() {
  try {
    const selectedSizes = Array.from(document.querySelectorAll('#dropdownSizes input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const selectedTypes = Array.from(document.querySelectorAll('#dropdownType input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const searchTerm = searchInput.value.toLowerCase();
    const selectedTypesGender = isMale ? ['1'] : isFemale ? ['2'] : [];

    const filteredClothesData = [];

    const nameSnapshots = await Promise.all(userClothesData.map((cloth) => getDoc(cloth.nameRef)));
    const clothTypeSnapshots = await Promise.all(userClothesData.map((cloth) => getDoc(cloth.clothTypeRef)));

    for (let i = 0; i < userClothesData.length; i++) {
      const cloth = userClothesData[i];
      const nameSnapshot = nameSnapshots[i];
      const name = nameSnapshot.data().name.toLowerCase();
      const clothTypeSnapshot = clothTypeSnapshots[i];
      const clothTypeValue = clothTypeSnapshot.data().name.toLowerCase();
      const sizeIds = cloth.sizeRefs.map((sizeRef) => sizeRef.id);

      if (
        (name.includes(searchTerm) || clothTypeValue.includes(searchTerm)) &&
        selectedSizes.some((size) => sizeIds.includes(size)) &&
        selectedTypes.includes(cloth.clothTypeRef.id) &&
        selectedTypesGender.includes(cloth.clothTypeGenderRef.id)
      ) {
        filteredClothesData.push(cloth);
      }
    }

    renderClothes(filteredClothesData);
  } catch (error) {
    console.error("Ошибка при обработке поиска и фильтрации:", error);
  }
}

async function addStyleToFavourites(styleId){
  const userCollection = collection(db, 'users');
  const userId = await getUserId();
  console.log(userId);
  if(userId === 'ALL'){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя добавить стиль в избранное для незарегистрированного пользователя",
    });
    return;
  }
  const userDoc = doc(userCollection, userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesStylеsIds = userData.idFavouriteStyles || [];


      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!favouritesStylеsIds.includes(styleId)) {
        // Добавляем идентификатор одежды к массиву
        favouritesStylеsIds.push(styleId);

        console.log(favouritesStylеsIds);
        console.log(styleId);
        // Обновляем данные пользователя в базе данных
        updateDoc(userDoc, { idFavouriteStyles: favouritesStylеsIds }).then(() => {
          Swal.fire({
            icon: "success",
            title: "Стиль добавлен в избранное!",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(function() {
          }, 2000);
        }).catch((error) => {
          console.error('Error updating user data:', error);
        });
      }
    }
  }).catch((error) => {
    console.error('Error fetching user data:', error);
  });
}

async function removeStyleFromFavourites(styleId){
  try {
    const userCollection = collection(db, 'users');
    const userDoc = doc(userCollection, userId);

    // Retrieve the user document
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesStylesIds = userData.idFavouriteStyles || [];

      favouritesStylesIds = favouritesStylesIds.filter((id) => id !== styleId);

      // Update the user document with the modified wardrobeClothesIds array
      await updateDoc(userDoc, { idFavouriteStyles: favouritesStylesIds });

      // Optional: You can also update the UI to reflect the deletion
      // For example, remove the deleted cloth from the DOM

      Swal.fire({
        icon: "success",
        title: "Стиль удален из избранного!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(function() {
      }, 2000);
    }
  } catch (error) {
    console.error('Error deleting style:', error);
  }
}

async function deleteStyle(styleId){
  Swal.fire({
    title: "Вы уверены, что хотите удалить стиль?",
    text: "Вы больше не сможете вернуть его",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    cancelButtonText: "Отмена",
    confirmButtonText: "Да, удалить!"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const stylesCollection = collection(db, 'styles');
        const stylesDoc = doc(stylesCollection, styleId);

        // Удаляем документ из коллекции "clothes" в Firestore
        await deleteDoc(stylesDoc);

        // Обновляем массив idWardrobeClothes каждого пользователя
        const usersCollection = collection(db, 'users');
        const usersQuerySnapshot = await getDocs(usersCollection);

        usersQuerySnapshot.forEach(async (userDoc) => {
          const userData = userDoc.data();
          let wardrobeStylesIds = userData.idFavouriteStyles || [];

          // Удаляем идентификатор удаляемой одежды из массива idWardrobeClothes
          wardrobeStylesIds = wardrobeStylesIds.filter((id) => id !== styleId);
          
          // Обновляем документ пользователя в Firestore с измененным массивом idWardrobeClothes
          await updateDoc(userDoc.ref, { idFavouriteStyles: wardrobeStylesIds });
        });
        getStyles();

        Swal.fire({
          title: "Удалено!",
          text: "Стиль был удален.",
          icon: "success"
        });
      } catch (error) {
        console.error("Ошибка при удалении одежды:", error);
        Swal.fire({
          title: "Ошибка!",
          text: "Произошла ошибка при удалении одежды.",
          icon: "error"
        });
      }
    }
  });
}

async function populateList(data, userStylesData, styleId, index) {
  let isFavourite = false;
  const stylesLists = document.getElementById('garderobStylesList');
  stylesLists.className = "p-4 -m-4 justify-center items-center";

  // Создание уникального id для блока
  const blockId = `stylesBlock${index}`;

  // Блок со стилями гардероба
  const stylesBlock = document.createElement('div');
  stylesBlock.id = blockId;
  stylesBlock.className = "-m-4 justify-center items-center";
  stylesBlock.innerHTML = `
    <div flex items-center justify-center>
    <div class="justify-center" style="display: flex; align-items: center;">
        <h1 id="txtName" class="text-4xl justify-center font-bold text-purple-800 text-center mt-10">${data.name}</h1>
        <svg class="h-8 w-8 mt-10 fill-current text-gray-500 hover:text-black ml-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path id="styleHeartIcon" d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#4f4f4f"/>
        </svg>
    </div>
      <h1 id="txtDescription" class="text-xl justify-center font-bold text-center mt-4">${data.description}</h1>
      <div class="w-full mt-4 mb-8 justify-center">
        <div class="h-1 mx-auto gradient w-84 opacity-25 my-0 py-0 rounded-t"></div>
      </div>
    </div>
  `;

  stylesLists.appendChild(stylesBlock);

  const buttonBlock = document.createElement('div');
  buttonBlock.className = "-m-4 justify-center items-center mb-8";
  buttonBlock.innerHTML = `
    <button hidden id="removeStyleFromWardrobeButton" type="button" class="gradient py-2 px-4  bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-purple-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
    Удалить стиль</button>
  `;
  stylesBlock.appendChild(buttonBlock);
  userStylesData.forEach((data) => {
    createClothBlock(data, 'garderobStylesList');
  });

  

  if(userId !== 'ALL'){
    
    const removeStyleFromWardrobeButton = stylesBlock.querySelector('#removeStyleFromWardrobeButton');
    removeStyleFromWardrobeButton.hidden = false;
    removeStyleFromWardrobeButton.addEventListener('click', () => {
      deleteStyle(styleId);
    });

    const userDoc = doc(userCollection, userId);

    // Получаем текущие данные пользователя
    getDoc(userDoc).then((userDocSnapshot) => {
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        let favouritesStylesIds = userData.idFavouriteStyles || [];

        // Преобразуем идентификатор стиля в числовой формат
        console.log(styleId);

        // Проверяем, содержит ли массив уже выбранный идентификатор стиля
        if (favouritesStylesIds.includes(styleId)) {
          isFavourite = true;
          const heartIcon = stylesBlock.querySelector('#styleHeartIcon');
          heartIcon.classList.add('filled-heart');
          console.log(`${styleId} в избранном`);
        }
      }})
  }

  const styleHeartIcon = stylesBlock.querySelector('#styleHeartIcon') 
  styleHeartIcon.addEventListener('click', () => {
  styleHeartIcon.classList.toggle('filled-heart');
  if(userId !== 'ALL'){
    if(!isFavourite){
      addStyleToFavourites(styleId);
      isFavourite = true;
    } 
    else if(isFavourite){
      removeStyleFromFavourites(styleId);
      isFavourite = false;
    } 
  }
});
}

async function getStyles(){
  let i = 0;
  let userStylesItemsQuery = null;
  const stylesBody = document.getElementById('garderobStylesList');
  stylesBody.innerHTML = '';

  // Запрос данных из коллекции shoppingCart для конкретного пользователя
  const stylesRef = collection(db, 'styles');
  // Запрос данных из коллекции shoppingCart для конкретного пользователя
  if(isMale){
    userStylesItemsQuery = query(stylesRef, 
      where('idUser', '==', userId),
      where('styleGender', '==', 'Мужской'));
  }
  else if(isFemale){
    userStylesItemsQuery = query(stylesRef, 
      where('idUser', '==', userId),
      where('styleGender', '==', 'Женский'));
  }
  

  // Получение данных из запроса
  getDocs(userStylesItemsQuery).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      i += 1;
      // Доступ к данным каждого документа и вывод информации о каждом элементе одежды
      const data = doc.data();

      // Преобразуем идентификаторы в строковый формат
      const userStylesIds = data.idClothes.map(String);
      // Фильтруем данные об одежде по идентификаторам из коллекции clothes
      userStylesData = clothesData.filter((cloth) => userStylesIds.includes(cloth.nameRef.id));
      
      populateList(data, userStylesData, doc.id,  i)
    });
  });
}




const garderobStylesBlock = document.getElementById('garderobStylesBlock');
const garderobClothesBlock = document.getElementById('garderobClothesBlock');
// Функция для обработки выбора одежды
function handleClothesSelection() {
  isClothes = true;
  isStyles = false;
  garderobStylesBlock.hidden = true;
  garderobClothesBlock.hidden = false;
}

// Функция для обработки выбора стилей
function handleStylesSelection() {
  isStyles = true;
  isClothes = false;
  
  garderobStylesBlock.hidden = false;
  garderobClothesBlock.hidden = true;
  getStyles();
}

// Функция для обработки выбора мужской одежды
function handleMaleSelection() {
  console.log('Выбрана мужская одежда');
  isMale = true;
  isFemale = false;
  handleSearchAndFilter();
  if(isStyles) getStyles();
}

// Функция для обработки выбора женской одежды
function handleFemaleSelection() {
  console.log('Выбрана женская одежда');
  isFemale = true;
  isMale = false;
  handleSearchAndFilter();
  if(isStyles) getStyles();
}



const searchInput = document.getElementById('search');
searchInput.addEventListener('input', handleSearchAndFilter);


const sizeCheckboxes = document.querySelectorAll('#dropdownSizes input[type="checkbox"]');
sizeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', handleSearchAndFilter);
});

const dropdownButton = document.getElementById('dropdownSizesButton');
// Обработчик события клика на кнопке
dropdownButton.addEventListener('click', function() {
  dropdownSizes.classList.toggle('hidden'); // Переключение класса для скрытия или показа выпадающего списка
});

const typeCheckboxes = document.querySelectorAll('#dropdownType input[type="checkbox"]');
typeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', handleSearchAndFilter);
});

const typeDropdownButton = document.getElementById('dropdownTypeButton');
// Обработчик события клика на кнопке
typeDropdownButton.addEventListener('click', function() {
  dropdownType.classList.toggle('hidden'); // Переключение класса для скрытия или показа выпадающего списка
});

//Изменение размеров окна
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth / 2;
  sizes.height = window.innerHeight / 2;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.render(scene, camera);
})

const authButton = document.getElementById('authButton');
authButton.addEventListener('click', function() {
    window.location.href = "auth.html";
});


// Получаем ссылки на кнопки
const maleButton = document.getElementById('male');
const femaleButton = document.getElementById('female');

if(isFemale){
  femaleButton.classList.add('active');
  maleButton.classList.remove('active');
}

// Добавляем обработчики событий для кнопок
maleButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Мужчина"
  maleButton.classList.add('active');
  // Удаляем класс активности с кнопки "Женщина"
  femaleButton.classList.remove('active');
  tshirtCounter = 0;
  coatCounter = 0;
  pantsCounter = 0;
  hatCounter = 0;

  tshirtId = 0;
  coatId = 0;
  pantsId = 0;
  hatId = 0;
  // Вызываем функцию для обработки выбора мужской одежды
  handleMaleSelection();
  saveStyleContainer.style.display = 'none';
  scene.clear();
  clearUiBlocks();
  createScene();
});

femaleButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Женщина"
  femaleButton.classList.add('active');
  // Удаляем класс активности с кнопки "Мужчина"
  maleButton.classList.remove('active');
  tshirtCounter = 0;
  coatCounter = 0;
  pantsCounter = 0;
  hatCounter = 0;

  tshirtId = 0;
  coatId = 0;
  pantsId = 0;
  hatId = 0;
  // Вызываем функцию для обработки выбора женской одежды
  handleFemaleSelection();
  saveStyleContainer.style.display = 'none';
  scene.clear();
  clearUiBlocks();
  createScene();
});

// Получаем ссылки на кнопки
const clothesButton = document.getElementById('clothes');
const stylesButton = document.getElementById('styles');


// Добавляем обработчики событий для кнопок
clothesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Мужчина"
  clothesButton.classList.add('active');
  // Удаляем класс активности с кнопки "Женщина"
  stylesButton.classList.remove('active');
  console.log('выбрана одежда');
  tshirtCounter = 0;
  coatCounter = 0;
  pantsCounter = 0;
  hatCounter = 0;

  tshirtId = 0;
  coatId = 0;
  pantsId = 0;
  hatId = 0;
  handleClothesSelection();
  saveStyleContainer.style.display = 'none';
  scene.clear();
  clearUiBlocks();
  createScene();
});

stylesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Женщина"
  stylesButton.classList.add('active');
  // Удаляем класс активности с кнопки "Мужчина"
  clothesButton.classList.remove('active');
  console.log('выбраны стили');
  tshirtCounter = 0;
  coatCounter = 0;
  pantsCounter = 0;
  hatCounter = 0;

  tshirtId = 0;
  coatId = 0;
  pantsId = 0;
  hatId = 0;
  handleStylesSelection();
  saveStyleContainer.style.display = 'none';
  scene.clear();
  clearUiBlocks();
  createScene();
});

async function createScene(){
  await addFloor();
  await addLights();
  loadMannequin();
}
async function clearUiBlocks(){
  const blocks = ['HatBlock', 'TshirtBlock', 'CoatBlock', 'PantsBlock'];
  const blocksImg = ['shapka', 'futbolka', 'hudi', 'shtani'];

  let i = 0;
  for(const blockElement of blocks){
    const block = document.getElementById(`${blockElement}`);
    let imageElement = block.querySelector('.imageContainer720x400');
    let nameElement = block.querySelector('.nameOne');
    const removeButton = block.querySelector('#removeButton');
    let colorsContainer = block.querySelector('.colorsContainer');
    let imagePath = `images/${blocksImg[i]}.png`;
    removeButton.hidden = true;
    if (colorsContainer) {
      colorsContainer.remove(); // Удаление контейнера с кнопками-кружочками цветов
    }
    nameElement.textContent = '';
    imageElement.src = imagePath;
    i += 1;
  }
  tshirtCounter = 0;
  pantsCounter = 0;
  coatCounter = 0;
  hatCounter = 0;
}



async function main(){
    await addFloor();
    await addLights();
    loadMannequin();
    await handleSearchAndFilter();
}

main();
tick();



import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import { InteractionManager } from "three.interactive";
import init from './init';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import './garderob.css';

const { sizes, camera, scene, canvas, controls, renderer, stats, gui } = init();

const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

let isMale = true;
let isFemale = false;

let _productsData = [];

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

let userStylesData = [];

let selectedProducts = {
  'tops': null,
  'bottoms': null,
  'headdresses': null,
  'accessories': null,
};;
const typeMappings = {
  'tops': ['1', '3', '5', '7'],
  'bottoms': ['2', '4', '6'],
  'headdresses': ['8', '9', '10', '13'],
  'accessories': ['11']
};

// Получаем идентификатор пользователя из локального хранилища
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

const userId = await getUserId()
if(userId === "ALL"){
  Swal.fire({
    icon: "info",
    title: "Вы не вошли в систему, поэтому будет предоставлена вся одежда",
  });
}

const userCollection = collection(db, 'users');
const userSnapshot = await getDoc(doc(userCollection, `${userId}`));
const userData = userSnapshot.data();
try{
  const userGender = userData.gender;
  if(userGender === "Женский"){
    isMale = false;
    isFemale = true;
  }
} catch(error){};

//Получение цветов
async function getProductColors(colorRefs) {
  const colorSnapshots = await Promise.all(colorRefs.map((colorRef) => getDoc(colorRef)));
  const colors = colorSnapshots.map((colorSnapshot) => colorSnapshot.data().hexColor).join(', ');
  return colors;
}

//Получение размеров
async function getProductSizes(sizeRefs) {
  const sizeSnapshots = await Promise.all(sizeRefs.map((sizeRef) => getDoc(sizeRef)));
  const sizes = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name).join(', ');
  return sizes;
}

//Получение типа
async function getProductTypeName(productTypeRef) {
  const productTypeSnapshot = await getDoc(productTypeRef);
  const productTypeValue = productTypeSnapshot.data().name;
  return productTypeValue;
}

// Получение значения Мужская/Женская
async function getProductGenderName(clothTypeRef) {
  const clothTypeSnapshot = await getDoc(clothTypeRef);
  const clothTypeValue = clothTypeSnapshot.data().name;
  return clothTypeValue;
}

// Получение данных о товаре
async function getProducts(snapshot){
  const promises = [];
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const idColors = data.idColors;
    const idSizes = data.idSizes;
    const name = data.name;
    const price = data.price;
    const discount = data.discount;
    const image = data.image;
    const genderId = data.idClothTypeGender;
    const typeId = data.idClothType;
    const model = data.model;

    const sizeRefs = idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));
    const colorRefs = idColors.map((colorId) => doc(db, 'colors', colorId.toString()));

    const productTypeRef = doc(db, 'clothType', data.idClothType.toString());
    const productGenderNameRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());

    promises.push(getProductTypeName(productTypeRef));
    promises.push(getProductGenderName(productGenderNameRef));
    promises.push(getProductSizes(sizeRefs));
    promises.push(getProductColors(colorRefs));

    neededData.push({
      idColors,
      id,
      name,
      price,
      typeId,
      model,
      productType: null,
      productGender: null,
      productSizes: null,
      productColors: null,
      discount,
      image,
      genderId
    });
  });

  const results = await Promise.all(promises);

  for (let i = 0; i < results.length; i += 4) {
    neededData[i / 4].productType = results[i];
    neededData[i / 4].productGender = results[i + 1];
    neededData[i / 4].productSizes = results[i + 2];
    neededData[i / 4].productColors = results[i + 3];
  }

  return neededData;
}

//Изменение размеров окна
window.addEventListener('resize', () => {
  sizes.width = ui.clientWidth - 36;
  sizes.height = window.innerHeight / 1.2;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.render(scene, camera);
  
})


//Пол
async function addFloor(){
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(60,60,2),
        new THREE.MeshStandardMaterial({
            color: '#393d3f',
            metalness: 0,
            roughness: 0.5,
        }),
    );
    floor.position.set(0, -0.9, 0);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI * 0.5;
    scene.add(floor);
}

//Свет
async function addLights(){
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
  hemiLight.position.set(0, 40, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xf3f3f3, 0.54);
  dirLight.position.set(12, 100, 80);
  dirLight.target.position.set(0, 21, 0);
  dirLight.castShadow = true;
  dirLight.shadow.bias = -0.01;
  dirLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
  scene.add(dirLight);

  const dirLightBack = new THREE.DirectionalLight(0xf3f3f3, 0.25);
  dirLightBack.position.set(10, 100, -80);
  dirLightBack.target.position.set(0, 20, 0);
  dirLightBack.castShadow = true;
  dirLightBack.shadow.bias = -0.01;
  dirLightBack.shadow.mapSize = new THREE.Vector2(2048, 2048);
  scene.add(dirLightBack);
}

//Текстуры
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('textures/fabric_104_ambientocclusion-1K.png');

//Материал
function setMaterial(currentColor, currentMetalness, currentRoughness, currentMap){
    return new THREE.MeshStandardMaterial({
        color: currentColor,
        metalness: currentMetalness,
        roughness: currentRoughness,
        //map: currentMap
    });
}


//Загрузка модели манекена
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
            mannequin.material = setMaterial("#F2DCC7", 0, 0.4, null);
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

// Функция перемещения камеры
function moveCamera(positionX, positionY, positionZ){
  const coords = { x: camera.position.x, y: camera.position.y, z: camera.position.z  };
  new TWEEN.Tween(coords)
    .to({x: positionX, y: positionY, z: positionZ })
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() =>
      camera.position.set(coords.x, coords.y, coords.z)
    )
    .start();
    controls.target = new THREE.Vector3(0,10,0);
}

// Обработчики кнопок "Навести камеру на.." 
const topsCameraButton = document.getElementById(`topsCameraButton`);
topsCameraButton.addEventListener("click", (event) => {
  event.stopPropagation();
  moveCamera(0, 18, 8);
});
const bottomsCameraButton = document.getElementById(`bottomsCameraButton`);
bottomsCameraButton.addEventListener("click", (event) => {
  event.stopPropagation();
  moveCamera(0, 12, 14);
});
const headdressesCameraButton = document.getElementById(`headdressesCameraButton`);
headdressesCameraButton.addEventListener("click", (event) => {
  event.stopPropagation();
  moveCamera(0, 24, 8);
});
const accessoriesCameraButton = document.getElementById(`accessoriesCameraButton`);
accessoriesCameraButton.addEventListener("click", (event) => {
  event.stopPropagation();
  moveCamera(0, 20, 12);
});

// Функция загрузки товара на сцену
function loadCloth(modelName, type, firstColor){
  const loader = new GLTFLoader();
  loader.load(
      `./3DModels/clothes/${modelName}.glb`,
      (gltf) => {
          console.log('success');
          console.log(gltf);
          const cloth = gltf.scene.children[0];

          cloth.name = type;

          cloth.addEventListener("click", (event) => {
            event.stopPropagation();
            if(type === 'tops') moveCamera(0, 18, 8);
            if(type === 'bottoms') moveCamera(0, 12, 14);
            if(type === 'headdresses') moveCamera(0, 24, 8);
            if(type === 'accessories') moveCamera(0, 20, 12);
          });
          interactionManager.add(cloth);

          scene.add(cloth);
          setColor(type, firstColor);
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

// Назначение цвета модели
function setColor(type, color){
  const productObject = scene.getObjectByName(type);
  productObject.material = setMaterial(color, 0, 0.9, texture);
}

//Анимация
const clock = new THREE.Clock();
const tick = () => {
    //stats.begin();
    controls.update();
    const delta = clock.getDelta();
    interactionManager.update();
    TWEEN.update();
    renderer.render(scene, camera);
    //stats.end();
    window.requestAnimationFrame(tick);
};

// Функция добавления стиля
async function saveStyle(){
  if(userId === "ALL"){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя создать стиль для незарегистрированного пользователя!",
    });
    return;
  }
  try{

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
            idClothes: Array.from(Object.values(selectedProducts)).filter(value => value !== null),
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

// Обработчик добавления стиля
const saveStyleContainer = document.getElementById('saveStyleContainer');
const saveStyleButton = document.getElementById('saveStyleButton');
saveStyleButton.addEventListener('click', function() {
  saveStyle();
});

//Создаем блок товара
async function createClothBlock(data, list) {
  try {
    let isFavourite = false;
    const clothesList = document.getElementById(list);
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "p-4 flex flex-shrink-0 justify-center items-center mb-4";
    clothesBlock.classList.add('inline-flex');
    clothesBlock.innerHTML = `
      <div class="relative group bg-gray-200 dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg cursor-pointer">
        <button id="deleteClothButton" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded" hidden>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
        <div class="relative group mt-2">
          <img class="img object-scale-down h-40 rounded w-40 object-center mb-6 group-hover:scale-105">
          <div class="absolute bottom-0 w-full opacity-0 group-hover:opacity-100 flex items-center w-full justify-center">
            <button id="addToSceneButton" class="bg-purple-600 w-full hover:bg-purple-700 text-gray-100 font-bold py-2 px-4 rounded-r rounded-l">
            Надеть
            </button>
          </div>
        </div>
        <h3 class="sizesOne tracking-widest text-purple-500 text-xs font-medium title-font">${data.productSizes}</h3>
        <h1 class="headingOne text-lg text-gray-700 dark:text-gray-200 font-medium title-font">${data.productType}</h4>
        <div class="flex items-end mb-4">
          <h5 class="headingTwo text-lg text-gray-800 dark:text-gray-100 font-medium title-font">${data.name}</h5>
          <svg class="h-8 w-8 fill-current text-gray-500 hover:text-black ml-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path id="heartIcon" d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#4f4f4f"/>
          </svg>
        </div>
        <div class="colorsOne flex mb-2"></div>
      </div>`;
    clothesList.appendChild(clothesBlock);

    const imageElement = clothesBlock.querySelector('.img'); 
    const colorsElement = clothesBlock.querySelector('.colorsOne');

    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    const colorsValues = data.productColors;

    // Создаем кружки цветов товара
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

        // Проверяем, содержит ли массив уже выбранный идентификатор одежды
        if (favouritesClothesIds.includes(data.id)) {
          isFavourite = true;
          const heartIcon = clothesBlock.querySelector('#heartIcon');
          heartIcon.classList.add('filled-heart');
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
        const clothId = data.id;
        deleteCloth(clothId);
        });
    }

    const heartIcon = clothesBlock.querySelector('#heartIcon') 
    heartIcon.addEventListener('click', () => {
      heartIcon.classList.toggle('filled-heart');
      if(userId !== 'ALL'){
        if(!isFavourite){
          addToFavourites(data.id);
          isFavourite = true;
        } 
        else if(isFavourite){
          removeFromFavourites(data.id);
          isFavourite = false;
        } 
      }
    });

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

// Функция добавления товара в избранное
async function addToFavourites(clothId) {
  const userCollection = collection(db, 'users');
  const userId = await getUserId();
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

      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!favouritesClothesIds.includes(clothId)) {
        // Добавляем идентификатор одежды к массиву
        favouritesClothesIds.push(clothId);

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

// Удаление товара из избранного
async function removeFromFavourites(clothId){
  try {
    const userCollection = collection(db, 'users');
    const userDoc = doc(userCollection, userId);

    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];

      const clothIdNumber = parseInt(clothId, 10);
      favouritesClothesIds = favouritesClothesIds.filter((id) => id !== clothIdNumber);

      await updateDoc(userDoc, { idFavourites: favouritesClothesIds });

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

// Удаление товара из примерочной 
async function deleteCloth(clothId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите удалить одежду из примерочной?",
      text: "Чтобы вернуть ее, вам придется заново добавить ее в каталоге",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, удалить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const userDoc = doc(userCollection, userId);


          const userDocSnapshot = await getDoc(userDoc);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            let wardrobeClothesIds = userData.idWardrobeClothes || [];

            wardrobeClothesIds = wardrobeClothesIds.filter((id) => id !== clothId);

            await updateDoc(userDoc, { idWardrobeClothes: wardrobeClothesIds });
          }
  
          Swal.fire({
            icon: "success",
            title: "Удалено!",
            text: "Одежда была удалена из примерочной.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(function() {
            location.reload();
          }, 2000);
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
    
  } catch (error) {
    console.error('Error deleting cloth:', error);
  }
}

//Удаление со сцены одежды
async function removeFromScene(type){
  try{
    const block = document.getElementById(`${type}Block`);
    const imageElement = block.querySelector('.image');
    const nameElement = block.querySelector('.name');
    const typeElement = block.querySelector('.productType');
    const priceElement = block.querySelector('.price');
    const removeButton = block.querySelector('#removeButton');
    const colorsContainer = block.querySelector('.colorsContainer');
    const imagePath = "images/upload-icon.svg";
    removeButton.hidden = true;
    colorsContainer.innerHTML = ``;
    const productObject = scene.getObjectByName(type);

    scene.remove(productObject);
    nameElement.textContent = '';
    typeElement.textContent = '';
    priceElement.textContent = '';
    imageElement.src = imagePath;

    selectedProducts[type] = null;

    // Подсчет заполненных полей
    let filledFields = 0;
    for (const key in selectedProducts) {
      if (selectedProducts[key] !== null) {
        filledFields++;
      }
    }
    if(filledFields < 3){
      saveStyleContainer.style.display = 'none';
    }
    
  }catch (error) {
    console.error("Ошибка при удалении одежды:", error);
  }
}

//Добавление одежды на сцену
async function addToScene(data) {
  try {
    const type = data.typeId;
    const colorsValues = data.productColors;

    const productType = Object.keys(typeMappings).find(key => typeMappings[key].includes(type));
    if (!productType) return;

    const block = document.getElementById(`${productType}Block`);
    const imageElement = block.querySelector('.image');
    const nameElement = block.querySelector('.name');
    const typeElement = block.querySelector('.productType');
    const priceElement = block.querySelector('.price');
    const removeButton = block.querySelector('#removeButton');

    if (selectedProducts[productType] !== null) removeFromScene(productType);

    removeButton.hidden = false;
    removeButton.addEventListener('click', () => {
      removeFromScene(productType);
    });

    const colorsContainer = block.querySelector('.colorsContainer');
    colorsContainer.innerHTML = '';

    colorsValues.split(',').forEach((color) => {
      const colorButton = document.createElement('button');
      colorButton.className = 'colorButton shadow hover:scale-105';
      colorButton.style.backgroundColor = color.trim();
      colorsContainer.appendChild(colorButton);

      colorButton.addEventListener('click', () => {
        setColor(productType, color.trim());
      });
    });

    const storageImageRef = ref(storage, `images/${data.image}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;
    nameElement.textContent = data.name;
    priceElement.textContent = `₽${data.price}`;
    typeElement.textContent = data.productType;

    const firstColor = colorsValues.split(',')[0].trim()

    loadCloth(data.model, productType, firstColor);
    selectedProducts[productType] = data.id;

    // Подсчет заполненных полей
    let filledFields = 0;
    for (const key in selectedProducts) {
      if (selectedProducts[key] !== null) {
        filledFields++;
      }
    }
    if(filledFields > 1){
      saveStyleContainer.style.display = 'block';
    }

  } catch (error) {
    console.error("Ошибка при добавлении одежды на сцену:", error);
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

// Обработка товаров примерочной по мужской и женской
async function handleSearchAndFilter(userClothesData) {
  try {
    const filteredClothesData = [];

    const selectedTypesGender = isMale ? ['1'] : isFemale ? ['2'] : [];

    for (let i = 0; i < userClothesData.length; i++) {
      const cloth = userClothesData[i];
      if (
        selectedTypesGender.includes(cloth.genderId)
      ) {
        filteredClothesData.push(cloth);
      }
    }

    renderClothes(filteredClothesData);
  } catch (error) {
    console.error("Ошибка при обработке поиска и фильтрации:", error);
  }
}

// Функция удаления стиля
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

        // Удаляем документ из коллекции "styles" в Firestore
        await deleteDoc(stylesDoc);

        const usersCollection = collection(db, 'users');
        const usersQuerySnapshot = await getDocs(usersCollection);

        usersQuerySnapshot.forEach(async (userDoc) => {
          const userData = userDoc.data();
          let wardrobeStylesIds = userData.idFavouriteStyles || [];

          // Удаляем идентификатор удаляемого стиля из массива wardrobeStylesIds
          wardrobeStylesIds = wardrobeStylesIds.filter((id) => id !== styleId);
          
          // Обновляем документ пользователя в Firestore с измененным массивом wardrobeStylesIds
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

// Создание блока стилей 
async function populateList(data, userStylesData, styleId, index) {
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

  }
}

// Получение стилей
async function getStyles(){
  let i = 0;
  let userStylesItemsQuery = null;
  const stylesBody = document.getElementById('garderobStylesList');
  stylesBody.innerHTML = '';

  const stylesRef = collection(db, 'styles');
  // Запрос данных из коллекции стилей для конкретного пользователя
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
      userStylesData = _productsData.filter((product) => userStylesIds.includes(product.id));
      
      populateList(data, userStylesData, doc.id,  i)
    });
  });
}

const garderobStylesBlock = document.getElementById('garderobStylesBlock');
const garderobClothesBlock = document.getElementById('garderobClothesBlock');

// Функция для обработки выбора одежды
function handleClothesSelection() {
  garderobStylesBlock.hidden = true;
  garderobClothesBlock.hidden = false;
}

// Функция для обработки выбора стилей
function handleStylesSelection() {
  garderobStylesBlock.hidden = false;
  garderobClothesBlock.hidden = true;
  getStyles();
}

// Функция для обработки выбора мужской одежды
function handleMaleSelection() {
  isMale = true;
  isFemale = false;
  handleSearchAndFilter(_productsData);
  getStyles();
}

// Функция для обработки выбора женской одежды
function handleFemaleSelection() {
  isFemale = true;
  isMale = false;
  handleSearchAndFilter(_productsData);
  getStyles();
}





// Получаем ссылки на кнопки
const maleButton = document.getElementById('male');
const femaleButton = document.getElementById('female');

if(isFemale){
  femaleButton.classList.add('active');
  maleButton.classList.remove('active');
}

// Обработчик выбора манекена мужчины
maleButton.addEventListener('click', function() {
  maleButton.classList.add('active');
  femaleButton.classList.remove('active');

  // Вызываем функцию для обработки выбора мужской одежды
  handleMaleSelection();
  saveStyleContainer.style.display = 'none';
  scene.clear();
  clearUiBlocks();
  createScene();
});

// Обработчик выбора манекена женщины
femaleButton.addEventListener('click', function() {
  femaleButton.classList.add('active');
  maleButton.classList.remove('active');

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


// Обработчик выбора блока одежды 
clothesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "одежда"
  clothesButton.classList.add('active');
  // Удаляем класс активности с кнопки "стили"
  stylesButton.classList.remove('active');
  console.log('выбрана одежда');

  handleClothesSelection();
  saveStyleContainer.style.display = 'none';
  scene.clear();
  clearUiBlocks();
  createScene();
});

// Обработчик выбора блока стилей 
stylesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "стили"
  stylesButton.classList.add('active');
  // Удаляем класс активности с кнопки "одежда"
  clothesButton.classList.remove('active');
  console.log('выбраны стили');

  handleStylesSelection();
  saveStyleContainer.style.display = 'none';
  scene.clear();
  clearUiBlocks();
  createScene();
});

// Функция создания сцены
async function createScene(){
  await addFloor();
  await addLights();
  loadMannequin();
}

// Функция очищения блоков сцены с товарами
async function clearUiBlocks(){
  const blocks = ['topsBlock', 'bottomsBlock', 'headdressesBlock', 'accessoriesBlock'];

  let i = 0;
  for(const blockElement of blocks){
    const block = document.getElementById(`${blockElement}`);
    const imageElement = block.querySelector('.image');
    const nameElement = block.querySelector('.name');
    const typeElement = block.querySelector('.productType');
    const priceElement = block.querySelector('.price');
    const removeButton = block.querySelector('#removeButton');
    let colorsContainer = block.querySelector('.colorsContainer');
    removeButton.hidden = true;
    colorsContainer.innerHTML = ''
    nameElement.textContent = '';
    typeElement.textContent = '';
    priceElement.textContent = '';
    imageElement.src = `images/upload-icon.svg`;
    i += 1;
  }
}

// Кнопка возвращения камеры сцены 
const returnCameraButton = document.getElementById('returnCameraButton');
returnCameraButton.addEventListener('click', function() {
  moveCamera(0,18,15);
	camera.lookAt(new THREE.Vector3(0,10,0));
  controls.target = new THREE.Vector3(0,10,0);
});


const ui = document.getElementById('ui');

//Получение данных товаров примерочной пользователя
async function getProductsData(userWardrobeClothesIds) {
  const clothesCollection = collection(db, 'clothes');

  const promises = userWardrobeClothesIds.map(async (clothesId) => {
    const docRef = doc(clothesCollection, clothesId);
    const docSnap = await getDoc(docRef);
    return docSnap;
  });

  const snapshots = await Promise.all(promises);

  return snapshots;
}


// Получение количества товаров в корзине
const cartCollection = collection(db, 'shoppingCart');
async function getCartItemsCount(idUser){
  const cartQuery = query(cartCollection, where('idUser', '==', idUser));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}


const notEmptyCartBlock = document.getElementById('notEmptyCartBlock');
const emptyCartBlock = document.getElementById('emptyCartBlock');
const cartModalList = document.getElementById('cartModalList');

// Функция для обработки пустой корзины
function handleEmptyCart() {
  notEmptyCartBlock.hidden = true;
  emptyCartBlock.hidden = false;
}

// Функция для обработки непустой корзины
function handleNotEmptyCart() {
  notEmptyCartBlock.hidden = false;
  emptyCartBlock.hidden = true;
}

// Показ уведомления
async function showAlert(title){
  let timerInterval;
      Swal.fire({
        title: title,
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          timerInterval = setInterval(() => {
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
          console.log("I was closed by the timer");
        }
      }); 
}

// Удаление товара из корзины
async function deleteFromCart(itemId){
  const shoppingCartRef = collection(db, 'shoppingCart');
  const itemDocRef = doc(shoppingCartRef, itemId);

  Swal.fire({
    title: "Вы уверены, что хотите удалить товар из корзины?",
    text: "Чтобы вернуть товар, необходимо добавить его в каталоге",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    cancelButtonText: "Отмена",
    confirmButtonText: "Да, удалить!"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await deleteDoc(itemDocRef);
        console.log('Документ успешно удален из корзины');
        showAlert("Удалено!");
        await getCartItemsCount(_userId).then(count => {
          const countElement = document.getElementById('cartCounter');
          countElement.textContent = count;
          if(count > 0) {
            renderCartModal();
            handleNotEmptyCart()
          }
          else{
            handleEmptyCart();
          }
        })

      } catch (error) {
        console.log('Ошибка при удалении документа:', error);
        showAlert("Не удалось удалить товар из корзины!");
      }
    }
  });
}

// Создание товара корзины в меню 
async function populateCartList(data, itemId){
  const userClothesItemsQuery = doc(clothesCollection, data.idCloth);

  // Получение данных из запроса
  getDoc(userClothesItemsQuery).then((doc) => {
      if (doc.exists()) {
      // Доступ к данным документа и вывод информации о каждом элементе одежды
      const productData = doc.data();
      const cartModalBlock = document.createElement('section');
      cartModalBlock.innerHTML = `
      <li class="flex items-center mb-2 rounded-md border border-2 border-gray-600 gradientReverse p-4 justify-center bg-opacity-75">
        <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
          <img src="" alt="image" class="Img h-full w-full object-cover object-center">
        </div>

        <div class="ml-4 flex flex-1 flex-col">
          <div>
            <div class="flex justify-between text-base font-medium text-gray-100">
              <h3>
                <a href="#" class="text-gray-700 dark:text-gray-100">${productData.name}</a>
              </h3>
              <p class="discountPrice ml-4 text-sm text-red-500"></p>
            </div>
          </div>
          <div class="flex flex-1 items-end justify-between text-l">
            <p class="discount text-red-500"></p>

            <div class="flex">
              <button type="button" class="deleteFromCartButton font-medium text-purple-400 hover:text-purple-300">Удалить</button>
            </div>
          </div>
        </div>
      </li>
      `;
      const discountElement = cartModalBlock.querySelector('.discount');
      const discountPriceElement = cartModalBlock.querySelector('.discountPrice');
      const clothImage = cartModalBlock.querySelector('.Img');

      const price = productData.price;
      const discount = productData.discount;
      if(discount != 0){
        discountElement.textContent = `-${discount}%`;
        discountElement.hidden = false;
  
        discountPriceElement.textContent = `₽${Math.round(price * (100 - discount) / 100)}`;
      }else{
        discountPriceElement.textContent = `₽${price}`;
      }

      const image = productData.image;
      const storageImageRef = ref(storage, `images/${image}.png`);
      const imageUrlPromise = getDownloadURL(storageImageRef);
      imageUrlPromise.then((imageUrl) => {
      clothImage.src = imageUrl;
      }).catch((error) => {
      console.log('Error retrieving image URL:', error);
      });
    
      const deleteFromCartButton = cartModalBlock.querySelector('.deleteFromCartButton');
      deleteFromCartButton.addEventListener('click', () => {
        deleteFromCart(itemId);
      });

      cartModalList.appendChild(cartModalBlock);

    } else {
    console.log('Документ не найден!');
    }
  }).catch((error) => {
      console.log('Ошибка:', error);
  });
}

// рендер корзины меню
async function renderCartModal(){
  cartModalList.innerHTML = ``;
  const userCartItemsQuery = query(cartCollection, where('idUser', '==', _userId));
  const querySnapshots = await getDocs(userCartItemsQuery);
  if(querySnapshots.empty){
    handleEmptyCart();
    return;
  } 
  // Получение данных из запроса
  getDocs(userCartItemsQuery).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // Доступ к данным каждого документа и вывод информации о каждом элементе одежды
      const data = doc.data();
      populateCartList(data, doc.id)
    });
    
  });
}

//переход на страницу профиля
async function goToProfile(){
  if(_userId !== 'ALL') window.location.href = "user_profile.html"
  else{
    Swal.fire({
      title: "Вы не вошли в систему. Перейти на страницу аутентификации?",
      showCancelButton: true,
      confirmButtonText: "Перейти",
      cancelButtonText: "Отмена",
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        window.location.href = "auth.html"
      }
    });
  }
}

// Выход из системы 
async function exitUser(){
  Swal.fire({
    title: "Вы уверены, что хотите выйти?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    cancelButtonText: "Отмена",
    confirmButtonText: "Да!"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        localStorage.setItem('userId', 'ALL');
        window.location.href = 'index.html';
      } catch (error) {
        console.log('Ошибка при удалении документа:', error);
        showAlert("Не удалось выйти из системы!");
      }
    }
  });
}

const toProfileButton = document.getElementById('toProfileButton');
toProfileButton.addEventListener('click', goToProfile);

const authButton = document.getElementById('authButton');
authButton.addEventListener('click', goToProfile);

const toProfileButtonMoile = document.getElementById('toProfileButtonMoile');
toProfileButtonMoile.addEventListener('click', goToProfile);

const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', exitUser);

let _userId = userId;

//Главная функция
async function main(){
  createScene();

  const userWardrobeClothesIds = userData.idWardrobeClothes.map(String);
  const userProducts = await getProductsData(userWardrobeClothesIds);
  const productsData = await getProducts(userProducts);
  _productsData = productsData;
  await handleSearchAndFilter(productsData);

  getStyles();

  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");


  await getCartItemsCount(userId).then(count => {
    console.log(`Количество документов с idUser ${userId}: ${count}`);
    const countElement = document.getElementById('cartCounter');
    countElement.textContent = count;
    if(count > 0) {
      renderCartModal();
      handleNotEmptyCart()
    }
    else{
      handleEmptyCart();
    }
  })
}

main();
tick();



import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import init from './init';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import './garderob.css';

const { sizes, camera, scene, canvas, controls, renderer, stats, gui } = init();

let tshirtCounter = 0;
let coatCounter = 0;
let pantsCounter = 0;

let isMale = true;
let isFemale = false;

// Получите идентификатор пользователя из локального хранилища
async function getUserId(){
  try{
    const userId = localStorage.getItem('userId');
    if(userId === null){
      alert('Вы не зарегестрированы, поэтому будет предоставлена вся одежда');
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

camera.position.y = 6;
camera.position.z = 8;

//Пол
async function addFloor(){
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(30,30,2),
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

//Материал
function setMaterial(currentColor, currentMetalness, currentRoughness, currentMap){
    return new THREE.MeshStandardMaterial({
        color: currentColor,
        metalness: currentMetalness,
        roughness: currentRoughness,
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
    else if(isFemale) path = './3DModels/female/scene.gltf';
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
function loadCloth(modelName, clothType){
  const loader = new GLTFLoader();
  loader.load(
      `./3DModels/clothes/${modelName}.glb`,
      (gltf) => {
          console.log('success');
          console.log(gltf);
          const cloth = gltf.scene.children[0];
          scene.add(cloth);
          cloth.name = clothType;
          
          if (clothType == "Футболка"){
            tshirtCounter += 1;
          }
          if (clothType == "Кофта"){
            coatCounter += 1;
          }
          if (clothType == "Брюки"){
            pantsCounter += 1;
          }

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
  console.log(clothType);
  const clothObject = scene.getObjectByName(clothType);
  console.log(clothObject);
  clothObject.material = setMaterial(color, 0, 0.4);
}

//Анимация
const clock = new THREE.Clock();
const tick = () => {
    //stats.begin();
    controls.update();
    const delta = clock.getDelta();

    if (camera.position.y < 2) {
        camera.position.y = 2;
    }

    TWEEN.update();
    renderer.render(scene, camera);
    //stats.end();
    window.requestAnimationFrame(tick);
};





const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function() {
    localStorage.setItem('userId', 'ALL');
    alert('Вы успешно вышли из системы');
    exitButton.hidden = true;
    location.reload();

});





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

// Получаем данные о пользователе
const userCollection = collection(db, 'users');
const userId = await getUserId()
console.log(userId);

if(userId !== 'ALL'){
  exitButton.hidden = false;
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
async function createClothBlock(data) {
  try {
    const clothesList = document.getElementById('garderobClothesList');
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "p-4 flex justify-center";
    clothesBlock.innerHTML = `
      <div class="imageContainerClothesOne720x400 bg-gray-100 p-6 rounded-lg border border-gray-950 shadow hover:shadow-lg">
        <img class="object-scale-down h-40 rounded w-40 object-center mb-6" src="" alt="content">
        <h3 class="sizesOne tracking-widest text-purple-500 text-xs font-medium title-font"></h3>
        <h1 class="headingOne text-lg text-gray-900 font-medium title-font"></h4>
        <h5 class="headingTwo text-lg text-gray-900 font-medium title-font"></h5>
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

      const addToSceneButton = clothesBlock.querySelector('#addToSceneButton');
      addToSceneButton.addEventListener('click', () => {
      addToScene(data);
      });

      const deleteClothButton = clothesBlock.querySelector('#deleteClothButton');
      if(userId !== 'ALL'){
        deleteClothButton.hidden = false;
        deleteClothButton.addEventListener('click', () => {
          const clothId = data.nameRef.id;
          deleteCloth(clothId);
          });
      }
    }
  } catch (error) {
    console.error("Error adding clothes:", error);
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
    const clothObject = scene.getObjectByName(clothType);
    scene.remove(clothObject);

    if (clothType == "Футболка"){
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

      tshirtCounter -= 1;
    }
    if (clothType == "Кофта"){
      block = document.getElementById('CoatBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');
      const removeButton = block.querySelector('#removeButton');
      colorsContainer = block.querySelector('.colorsContainer');
      imagePath = "images/coat.png";
      removeButton.hidden = true;
      if (colorsContainer) {
        colorsContainer.remove(); // Удаление контейнера с кнопками-кружочками цветов
      }

      coatCounter -= 1;
    }
    if (clothType == "Брюки"){
      block = document.getElementById('PantsBlock');
      imageElement = block.querySelector('.imageContainer720x400');
      nameElement = block.querySelector('.nameOne');
      const removeButton = block.querySelector('#removeButton');
      colorsContainer = block.querySelector('.colorsContainer');
      imagePath = "images/pants.png";
      removeButton.hidden = true;
      if (colorsContainer) {
        colorsContainer.remove(); // Удаление контейнера с кнопками-кружочками цветов
      }

      pantsCounter -= 1;
    }
    nameElement.textContent = '';
    imageElement.src = imagePath;
    
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

    if (clothTypeValue == "Футболка"){
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
    if (clothTypeValue == "Кофта"){
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
    if (clothTypeValue == "Брюки"){
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

    colorsContainer = document.createElement('div');
    colorsContainer.className = 'colorsContainer mt-4';
    block.appendChild(colorsContainer);

    colorsValues.split(',').forEach((color) => {
      const colorButton = document.createElement('button');
      colorButton.className = 'colorButton shadow hover:shadow-lg';
      colorButton.style.backgroundColor = color.trim();
      colorsContainer.appendChild(colorButton);

      colorButton.addEventListener('click', () => {
        setColor(clothTypeValue, color.trim());
        console.log(color);
      });
      
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
      loadCloth(modelName, clothTypeValue);

      
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
    createClothBlock(data);
  });
}
//Проверяем комбобоксы и поиск
async function handleSearchAndFilter() {
    try {
    let selectedTypesGender = [];
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSizes = Array.from(document.querySelectorAll('#dropdownSizes input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const selectedTypes = Array.from(document.querySelectorAll('#dropdownType input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    if(isMale) selectedTypesGender = ['1','3'];
    else if (isFemale) selectedTypesGender = ['2','3'];

    const filteredClothesData = [];

    for (const cloth of userClothesData) {
      const nameSnapshot = await getDoc(cloth.nameRef);
      const name = nameSnapshot.data().name.toLowerCase();
      const clothTypeSnapshot = await getDoc(cloth.clothTypeRef);
      const clothTypeValue = clothTypeSnapshot.data().name.toLowerCase();
      const sizeIds = cloth.sizeRefs.map((sizeRef) => sizeRef.id);

      if ((name.includes(searchTerm) || (clothTypeValue.includes(searchTerm))) && selectedSizes.some((size) => sizeIds.includes(size)) 
      && selectedTypes.includes(cloth.clothTypeRef.id) && selectedTypesGender.includes(cloth.clothTypeGenderRef.id)) {
        filteredClothesData.push(cloth);
      }
    }

    renderClothes(filteredClothesData);
  } catch (error) {
    console.error("Ошибка при обработке поиска и фильтрации:", error);
  }
}

// Функция для обработки выбора мужской одежды
function handleMaleSelection() {
  // Ваш код для обработки выбора мужской одежды
  console.log('Выбрана мужская одежда');
  isMale = true;
  isFemale = false;
  handleSearchAndFilter();
}

// Функция для обработки выбора женской одежды
function handleFemaleSelection() {
  // Ваш код для обработки выбора женской одежды
  console.log('Выбрана женская одежда');
  isFemale = true;
  isMale = false;
  handleSearchAndFilter();
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
  // Вызываем функцию для обработки выбора мужской одежды
  handleMaleSelection();
  scene.clear();
  clearUiBlocks();
  createScene();
});

femaleButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Женщина"
  femaleButton.classList.add('active');
  // Удаляем класс активности с кнопки "Мужчина"
  maleButton.classList.remove('active');
  // Вызываем функцию для обработки выбора женской одежды
  handleFemaleSelection();
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
  const blocks = ['TshirtBlock', 'JacketBlock', 'CoatBlock', 'PantsBlock'];
  const blocksImg = ['tshirt', 'jacket', 'coat', 'pants'];

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
}


async function main(){
    await addFloor();
    await addLights();
    loadMannequin();
    await handleSearchAndFilter();
}

main();
tick();



import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import init from './init_three';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import '../catalog.css';

import { Modal } from 'flowbite'


const $modalElement = document.getElementById('crud-modal');
const modal = new Modal($modalElement);

const { sizes, camera, scene, canvas, controls, renderer, stats, gui } = init();


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
const texture = textureLoader.load('textures/1K_fabric_73_roughness.png');

//Материал
function setMaterial(currentColor, currentMetalness, currentRoughness, currentMap){
  return new THREE.MeshStandardMaterial({
      color: currentColor,
      metalness: currentMetalness,
      roughness: currentRoughness,
      //map: texture
  });
}

//Цвет
function setColor(color){
  const productObject = scene.getObjectByName('product');
  productObject.material = setMaterial(color, 0, 0.4);
}

function loadMannequin(gender){
  const mannequinObject = scene.getObjectByName('mannequin');
  scene.remove(mannequinObject);
  let path = null;
  if(gender == 'Мужская') path = './3DModels/male/mannequinMale.glb';
  else if(gender == 'Женская') path = './3DModels/female/mannequinFemale.glb';
  const loader = new GLTFLoader();
  loader.load(
      path,
      (gltf) => {
          console.log('success');
          console.log(gltf);
          const mannequin = gltf.scene.children[0];
          mannequin.material = setMaterial("#F2DCC7", 0, 0.4);
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

function loadModel(model){
  const productObject = scene.getObjectByName('product');
  scene.remove(productObject);
  const loader = new GLTFLoader();
  loader.load(
      model,
      (gltf) => {
          console.log('success');
          console.log(gltf);
          const cloth = gltf.scene.children[0];
          cloth.name = "product";
          scene.add(cloth);
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


//Изменение размера окна
const ui = document.getElementById('modalWindow');
window.addEventListener('resize', () => {
  sizes.width = ui.clientWidth / 1.2,
  sizes.height = window.innerHeight / 1.5,

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.render(scene, camera);
})


// Получение идентификатора пользователя из локального хранилища
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

let isClothes = true;
let isStyles = false;
let sortParameter = 'noSort';
let filteredProducts = [];


const firebaseConfig = {
  apiKey: "AIzaSyAgfHpqhm8BYiQTE30cusEJMC4uK8lTPis",
  authDomain: "virt-shop.firebaseapp.com",
  databaseURL: "https://virt-shop-default-rtdb.firebaseio.com",
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
let productsData = [];


async function getProductSizes(sizeRefs) {
  const sizeSnapshots = await Promise.all(sizeRefs.map((sizeRef) => getDoc(sizeRef)));
  const sizes = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name).join(', ');
  return sizes;
}

async function getProductTypeName(productTypeRef) {
  const productTypeSnapshot = await getDoc(productTypeRef);
  const productTypeValue = productTypeSnapshot.data().name;
  return productTypeValue;
}

async function getProductGenderName(clothTypeRef) {
  const clothTypeSnapshot = await getDoc(clothTypeRef);
  const clothTypeValue = clothTypeSnapshot.data().name;
  return clothTypeValue;
}

async function getProducts(snapshot){
  const promises = [];
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const idColors = data.idColors;
    const idMaterial = data.idMaterial;
    const idSizes = data.idSizes;
    const idClothType = data.idClothType;
    const idClothTypeGender = data.idClothTypeGender;
    const name = data.name;
    const price = data.price;
    const discount = data.discount;
    const image = data.image;
    const createAt = data.createAt;
    const description = data.description;
    const ordered = data.ordered;
    const model = data.model;
    const isNew = data.isNew;
    const isActivated = data.isActivated;


    const sizeRefs = idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));

    const productTypeRef = doc(db, 'clothType', data.idClothType.toString());
    const productGenderNameRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());

    promises.push(getProductTypeName(productTypeRef));
    promises.push(getProductGenderName(productGenderNameRef));
    promises.push(getProductSizes(sizeRefs));


    neededData.push({
      idColors,
      idMaterial,
      idSizes,
      id,
      name,
      price,
      idClothType,
      idClothTypeGender,
      productType: null,
      productGender: null,
      productSizes: null,
      discount,
      image,
      createAt,
      description,
      ordered,
      model,
      isNew,
      isActivated
    });
  });

  const results = await Promise.all(promises);

  for (let i = 0; i < results.length; i += 3) {
    neededData[i / 3].productType = results[i];
    neededData[i / 3].productGender = results[i + 1];
    neededData[i / 3].productSizes = results[i + 2];
  }

  return neededData;
}

async function deactivateProduct(productId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите деактивировать товар?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, деактивировать!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const productDoc = doc(clothesCollection, productId);
          await updateDoc(productDoc, { isActivated: false });

          Swal.fire({
            icon: "success",
            title: "Деактивирован!",
            text: "Товар был успешно деактивирован.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const clothesSnapshot = await getDocs(clothesCollection);
            productsData = await getProducts(clothesSnapshot);
            await renderProducts(productsData);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при деактивации товара:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при деактивации товара.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error deactivate product ${productId}:`, error);
  }
}

async function activateProduct(productId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите активировать товар?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, активировать!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const productDoc = doc(clothesCollection, productId);
          await updateDoc(productDoc, { isActivated: true });

          Swal.fire({
            icon: "success",
            title: "Активирован!",
            text: "Товар был успешно активирован.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const clothesSnapshot = await getDocs(clothesCollection);
            productsData = await getProducts(clothesSnapshot);
            await renderProducts(productsData);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при активации товара:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при активации товара.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error deactivate product ${productId}:`, error);
  }
}

//Создаем Таблицу
async function createProductsTable(data, tableBody) {
  try {
    const newRow = document.createElement('tr');
    newRow.className = 'h-24 border-gray-400 dark:border-gray-300 border-b dark:text-gray-300 text-gray-700';
    newRow.hidden = true;

  
    // Populate the table row with data from Firestore
    newRow.innerHTML = `
    <td class="pl-8 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.id}</td>
    <td class="pr-6 whitespace-no-wrap">
      <div class="flex items-center">
          <div class="h-8 w-8">
              <img class="img h-full w-full overflow-hidden object-scale-down" />
          </div>
          <p class="ml-2 text-purple-500 tracking-normal leading-4 text-m">${data.name}</p>
      </div>
    </td>
    <td class="text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.productType}</td>
    <td class="price text-sm pr-6 whitespace-no-wrap text-red-400 tracking-normal leading-4"></td>
    <td class="text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.createAt}</td>
    <td class="text-sm pr-6 whitespace-no-wrap tracking-normal leading-4">
      <div aria-label="documents" role="contentinfo" class="relative w-10 text-gray-100">
          <div class="absolute top-0 right-0 w-5 h-5 mr-2 -mt-1 rounded-full bg-indigo-700 text-white flex justify-center items-center text-xs">${data.ordered}</div>
          <img class="dark:hidden" src="../images/purchase-white.svg" alt="icon-tabler-file">
          <img class="dark:block hidden text-gray-900 bg-gray-900" src="https://tuk-cdn.s3.amazonaws.com/can-uploader/compact_table_with_actions_and_select-svg8dark.svg" alt="icon-tabler-file">
      </div>
    </td>
    <td class="pr-6">
        <div class="productGender w-2 h-2 rounded-full"></div>
    </td>
    <td class="pr-8 relative">
      <button aria-label="dropdown" role="button" class="dropbtn text-gray-500 rounded cursor-pointer border border-transparent  focus:outline-none focus:ring-2 focus:ring-offset-2  focus:ring-gray-400">
          <img src="https://tuk-cdn.s3.amazonaws.com/can-uploader/compact_table_with_actions_and_select-svg9.svg" alt="dropdown">
      </button>
      <div class="dropdown-content mt-1 absolute left-0 -ml-12 shadow-md z-10 hidden w-32">
          <ul class="bg-white dark:bg-gray-800 shadow rounded py-1">
              <button id="updateButton" data-modal-target="crud-modal" data-modal-toggle="crud-modal" role="button" aria-label="add table" class="text-left w-full text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-purple-500 hover:text-purple-400 px-3 font-normal">Изменить</button>
              <button id="deleteButton" class="text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-red-500 hover:text-red-400 px-3 font-normal">Удалить</button>
              <button id="deactivateButton" class="text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-indigo-500 hover:text-indigo-400 px-3 font-normal">Деактивировать</button>
              <button id="activateButton" class="hidden text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-indigo-500 hover:text-indigo-400 px-3 font-normal">Активировать</button>
          </ul>
      </div>
    </td>
    `;
    const imageElement = newRow.querySelector('.img');
    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    const priceElement = newRow.querySelector('.price');
    const price = data.price;
    const discount = data.discount;
    if(discount != 0){
      priceElement.textContent = `₽ ${price * (100 - discount) / 100}`;
    }else{
      priceElement.textContent = `₽ ${price}`;
    }

    const productGenderElement = newRow.querySelector('.productGender');
    if(data.productGender == 'Мужская'){ productGenderElement.className = 'productGender w-2 h-2 rounded-full bg-indigo-400';}
    else{productGenderElement.className = 'productGender w-2 h-2 rounded-full bg-red-400';}

    tableBody.appendChild(newRow);
    newRow.hidden = false;

    const updateButton = newRow.querySelector('#updateButton');
    updateButton.addEventListener('click', () => {
      updateProduct(data);
    });


    const deleteButton = newRow.querySelector('#deleteButton');
    deleteButton.addEventListener('click', () => {
      const productId = data.id;
      deleteProduct(productId);
    });

    const deactivateButton = newRow.querySelector('#deactivateButton');
    const activateButton = newRow.querySelector('#activateButton');

    if(!data.isActivated){deactivateButton.classList.add('hidden'); activateButton.classList.remove('hidden')}

    deactivateButton.addEventListener('click', () => {
      const productId = data.id;
      deactivateProduct(productId);
    });

    activateButton.addEventListener('click', () => {
      const productId = data.id;
      activateProduct(productId);
    });


    var button = newRow.querySelector('.dropbtn');
    // Get the dropdown content element
    var dropdownContent = newRow.querySelector('.dropdown-content');


    // Add a click event listener to the button
    button.addEventListener('click', function() {
      // Toggle the visibility of the dropdown content
      dropdownContent.classList.toggle('hidden');
    });

  } catch (error) {
    console.error(`Error showing product ${data.id}:`, error);
  }
}


//Рендерим все найденное
async function renderProducts(products) {
  const productsTableBody = document.getElementById('productsTable');
  productsTableBody.innerHTML = '';
  products.forEach((data) => {
    createProductsTable(data, productsTableBody);
  });
}

async function showColors(productColors){

  const selectedOptions = Array.from(productColors.selectedOptions).map(option => option.value);
  const modelColors = document.getElementById('modelColors');
  modelColors.innerHTML = '';
  const colorsContainer = document.createElement('div');
  colorsContainer.className = 'colorsContainer justify-center items-center';
  modelColors.appendChild(colorsContainer);
  const collectionRef = collection(db, 'colors');
  const querySnapshot = await getDocs(collectionRef); // Получаем все документы из коллекции 'colors'

  querySnapshot.forEach((colorDoc) => {
    if (selectedOptions.includes(colorDoc.id)) { // Проверяем, содержится ли id документа в выбранных опциях
      const color = colorDoc.data().hexColor;
      const colorButton = document.createElement('button');
      colorButton.className = 'justify-between shadow hover:shadow-lg w-8 h-8 rounded-full border border-white';
      colorButton.style.backgroundColor = color.trim();
      colorsContainer.appendChild(colorButton);
      colorButton.addEventListener('click', (event) => {
        event.preventDefault();
        setColor(color);
      });
    }
  });
}

async function getFirstColor(productColors){
  const selectedOptions = Array.from(productColors.selectedOptions).map(option => option.value);
  const firstColorValue = selectedOptions[0];
  const colorsCollection = collection(db, 'colors')
  const colorSnapshot = await getDoc(doc(colorsCollection, `${firstColorValue}`));
  return colorSnapshot.data().hexColor;
}

async function populateSelect(id, targetCollection) {
  const selectElement = document.getElementById(id);
  selectElement.innerHTML = '';
  const сollection = collection(db, targetCollection);
  const snapshot = await getDocs(сollection);

  snapshot.forEach((doc) => {
    const id = doc.id;
    const name = doc.data().name;

    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    selectElement.appendChild(option);
  });
}

function showMultiselectValues(select, array, valuesArea){
  Array.from(select.options).forEach(option => {
    if (array.includes(Number(option.value))) {
      option.selected = true;
    }
  });
  const selectedValues = document.getElementById(valuesArea);
  const selectedOptions = Array.from(select.selectedOptions).map(option => option.text);
  selectedValues.textContent = selectedOptions.join(', ');
}

function clearSelect(select, valuesArea){
  for (let i = 0; i < select.options.length; i++) {
    select.options[i].selected = false;
  }
  const selectedValues = document.getElementById(valuesArea);
  selectedValues.textContent = 'Выберите..';
}

async function updateProduct(data){
  try {
    const modelColors = document.getElementById('modelColors');
    modelColors.innerHTML = '';
    if(data === null) loadMannequin('Мужская');
    let model = null;
    const productObject = scene.getObjectByName('product');
    scene.remove(productObject);

    const productName = document.getElementById('name');
    const productDescription = document.getElementById('description');
    const productTypeValue = document.getElementById('select_typeProduct');
    const productGender = document.getElementById('select_genderProduct');
    const productSizes = document.getElementById('select_size');
    const productColors = document.getElementById('select_color');
    const productMaterial = document.getElementById('select_material');
    const productPrice = document.getElementById('price');
    const productDiscount = document.getElementById('discount');
    const productImage = document.getElementById('product_image');
    const productImageName = document.getElementById('image_name');
    const productModelName = document.getElementById('model_name');

    productName.value = '';
    productDescription.value = '';
    productTypeValue.value = '';
    productGender.value = '';
    clearSelect(productSizes, 'selected-sizes');
    clearSelect(productColors, 'selected-colors');
    productMaterial.value = '';
    productPrice.value = '';
    productDiscount.value = '';
    productImageName.value = '';
    productImage.src = "";
    productModelName.value = '';

    await populateSelect('select_genderProduct', 'clothTypeGender');
    await populateSelect('select_typeProduct', 'clothType');
    await populateSelect('select_material', 'materials');
    modal.show();
    await populateSelect('select_size', 'sizes');
    await populateSelect('select_color', 'colors');

    productColors.addEventListener('change', async() => {
      const firstColor = await getFirstColor(productColors);
      if (model !== null) {setColor(firstColor); await showColors(productColors);};
    });

    if(data !== null) {
      productName.value = data.name;
      productDescription.value = data.description;
      productPrice.value = data.price;
      productDiscount.value = data.discount;

      productGender.value = data.idClothTypeGender;
      loadMannequin(data.productGender);

      productTypeValue.value = data.idClothType;

      const sizesArray = data.idSizes;
      showMultiselectValues(productSizes, sizesArray, 'selected-sizes');

      const colorsArray = data.idColors;
      showMultiselectValues(productColors, colorsArray, 'selected-colors');

      productMaterial.value = data.idMaterial;

      const imagePath = data.image;
      const storageImageRef = ref(storage, `images/${imagePath}.png`);
      const imageUrl = await getDownloadURL(storageImageRef);
      productImage.src = imageUrl;
      productImageName.value = `${imagePath}.png`;

      model = data.model;
      loadModel(`./3DModels/clothes/${model}.glb`);
      const firstColor = await getFirstColor(productColors);
      setColor(firstColor);
      productModelName.value = `${model}.glb`;
      await showColors(productColors);
    }

    const imageInput = document.getElementById('file-upload');
    imageInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', (readerEvent) => {
          productImage.src = readerEvent.target.result;
        });
        reader.readAsDataURL(file);
      }
      productImageName.value = file.name;
    });

    const productModel = document.getElementById('product_model');
    productModel.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', async(readerEvent) => {
          let firstColor = '#000000';
          model = readerEvent.target.result;
          loadModel(model);
          const selectedColorOptions = Array.from(productColors.selectedOptions).map(option => option.value);
          if(selectedColorOptions.length > 0){
            firstColor = await getFirstColor(productColors);
            if (model !== null) {setColor(firstColor); await showColors(productColors);};
          }
        });
        reader.readAsDataURL(file);
      }
      productModelName.value = file.name;
    });

    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', async(event) => {
      event.preventDefault();
      const selectedColorsOptions = Array.from(productColors.selectedOptions).map(option => parseInt(option.value));
      const selectedSizesOptions = Array.from(productSizes.selectedOptions).map(option => parseInt(option.value));
      
      const imageFileName = productImageName.value.substring(0, productImageName.value.lastIndexOf('.'));
      const modelFileName = productModelName.value.substring(0, productModelName.value.lastIndexOf('.'));

      const selectedFile = imageInput.files[0];
      if(selectedFile){
        const fullFileName = selectedFile.name;
        const imageFileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
        const storageRef = ref(storage, `images/${imageFileName}.png`);
        await uploadBytes(storageRef, selectedFile);
      }

      let productOrdered = 0;

      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      let productCreateAt = `${month}.${day}.${year}`;

      let productIsNew = true;

      if(data !== null){
        productOrdered = data.ordered;
        productCreateAt = data.createAt;
        productIsNew = data.isNew;
      }

      const product = {
        name: productName.value,
        description: productDescription.value,
        price: parseFloat(productPrice.value),
        discount: parseFloat(productDiscount.value),
        idClothType: productTypeValue.value,
        idClothTypeGender: productGender.value,
        idColors: selectedColorsOptions,
        idMaterial: productMaterial.value,
        idSizes: selectedSizesOptions,
        image: imageFileName,
        model: modelFileName,
        ordered: productOrdered,
        createAt: productCreateAt,
        isNew: productIsNew,
        isActivated: true
      };
      console.log(product);

      if(data === null){
        try {
          await addDoc(clothesCollection, product)
          Swal.fire({
            icon: "success",
            title: "Добавлено!",
            text: "Товар был успешно добавлен.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            productsData = await getProducts(clothesSnapshot);
            await renderProducts(productsData);
            modal.hide();
          }, 2000);
        }
        catch (error) {
          console.error(`Error adding new product:`, error);
        }
      }
      else {
        // Update the document in the "clothes" collection with the selected color and size IDs
        const docRef = doc(db, 'clothes', data.id);
        updateDoc(docRef, product);
        Swal.fire({
          icon: "success",
          title: "Изменено!",
          text: "Данные товара были успешно изменены.",
          showConfirmButton: false,
          timer: 1500
        });
        setTimeout(async function() {
          const clothesSnapshot = await getDocs(clothesCollection);
          productsData = await getProducts(clothesSnapshot);
          await renderProducts(productsData);
          modal.hide();
        }, 2000);
      }
    });
    model = null;

  } catch (error) {
    console.error(`Error updating product ${data.id}:`, error);
  }
}



async function deleteProduct(productId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите удалить товар?",
      text: "Чтобы вернуть его, вам придется заново заполнить все поля",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, удалить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const clothDoc = doc(clothesCollection, productId);
  
          // Удаляем документ из коллекции "clothes" в Firestore
          await deleteDoc(clothDoc);
  
          // Обновляем массив idWardrobeClothes каждого пользователя
          const usersCollection = collection(db, 'users');
          const usersQuerySnapshot = await getDocs(usersCollection);
  
          usersQuerySnapshot.forEach(async (userDoc) => {
            const userData = userDoc.data();
            let wardrobeClothesIds = userData.idWardrobeClothes || [];
            let favouritesClothesIds = userData.idWardrobeClothes || [];

            // Удаляем идентификатор удаляемой одежды из массивов
            wardrobeClothesIds = wardrobeClothesIds.filter((id) => id !== productId);
            favouritesClothesIds = favouritesClothesIds.filter((id) => id !== productId);
  
            // Обновляем документ пользователя в Firestore с измененным массивом idWardrobeClothes
            await updateDoc(userDoc.ref, { idWardrobeClothes: wardrobeClothesIds, idFavourites: favouritesClothesIds });
          });

          Swal.fire({
            icon: "success",
            title: "Удалено!",
            text: "Товар был успешно удален.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const clothesSnapshot = await getDocs(clothesCollection);
            productsData = await getProducts(clothesSnapshot);
            await renderProducts(productsData);
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
    console.error(`Error deleting product ${productId}:`, error);
  }
}

const multiselectSize = document.getElementById('select_size');
const selectedValuesSize = document.getElementById('selected-sizes');

multiselectSize.addEventListener('change', function() {
  selectedValuesSize.innerHTML = '';
  const selectedOptions = Array.from(this.selectedOptions).map(option => option.text);
  selectedValuesSize.textContent = selectedOptions.join(', ');
});

const multiselectColor = document.getElementById('select_color');
const selectedValuesColor = document.getElementById('selected-colors');

multiselectColor.addEventListener('change', function() {
  selectedValuesColor.innerHTML = '';
  const selectedOptions = Array.from(this.selectedOptions).map(option => option.text);
  selectedValuesColor.textContent = selectedOptions.join(', ');
});


const productGender = document.getElementById('select_genderProduct');
productGender.addEventListener('change', function() {
    if(productGender.value == 1){loadMannequin('Мужская');}
    else if(productGender.value == 2){loadMannequin('Женская');}
});


const addProductButton = document.getElementById('addProductButton');
addProductButton.addEventListener('click', function() {
  updateProduct(null);
});


async function searchProducts(text){

  const searchText = text.toLowerCase();
  const processedText = searchText
    .split('')
    .map((char, index) =>
      index === 0 ? char.toUpperCase() : char
    )
    .join('');
  const start = processedText;
  const end = processedText + '\uf8ff';
  const q = query(
    collection(db, "clothes"),
    where("name", ">=", start),
    where("name", "<=", end)
  );

  const querySnapshot = await getDocs(q);
  filteredProducts = [];
  filteredProducts = await getProducts(querySnapshot);

  await renderProducts(filteredProducts);
}

const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
// Добавляем обработчик события на поле ввода
searchInput.addEventListener('keydown', function(event) {
  // Проверяем, нажата ли клавиша Enter
  if (event.key === 'Enter') {
    // Вызываем функцию search()
    searchProducts(searchInput.value);
  }
});
searchButton.addEventListener('click', (event) => {
  event.preventDefault();
  searchProducts(searchInput.value);
})

const downloadRPButton = document.getElementById('downloadRP');
downloadRPButton.addEventListener('click', (event) => {
    // код для скачивания файла
    const link = document.createElement('a');
    link.href = 'word/Rp.docx';
    link.download = 'Rp.docx';
    link.click();
})


const cartCollection = collection(db, 'shoppingCart');
async function getCartItemsCount(idUser){
  const cartQuery = query(cartCollection, where('idUser', '==', idUser));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}


const notEmptyCartBlock = document.getElementById('notEmptyCartBlock');
const emptyCartBlock = document.getElementById('emptyCartBlock');
const cartModalList = document.getElementById('cartModalList');

// Функция для обработки выбора одежды
function handleEmptyCart() {
  notEmptyCartBlock.hidden = true;
  emptyCartBlock.hidden = false;
}

// Функция для обработки выбора стилей
function handleNotEmptyCart() {
  notEmptyCartBlock.hidden = false;
  emptyCartBlock.hidden = true;
}


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
              <p class="ml-4 text-sm text-red-500">₽${productData.price}</p>
            </div>
          </div>
          <div class="flex flex-1 items-end justify-between text-l">
            <p class="text-red-500">-${productData.discount}%</p>

            <div class="flex">
              <button type="button" class="deleteFromCartButton font-medium text-purple-400 hover:text-purple-300">Удалить</button>
            </div>
          </div>
        </div>
      </li>
      `;
      const clothImage = cartModalBlock.querySelector('.Img');
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

const _userId = await getUserId();

async function main(){
  productsData = await getProducts(clothesSnapshot);
  await renderProducts(productsData);
  filteredProducts = productsData;
  //await renderFilters();
  await addFloor();
  await addLights();

  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");

  await getCartItemsCount(_userId).then(count => {
    console.log(`Количество документов с idUser ${_userId}: ${count}`);
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

main()
tick();
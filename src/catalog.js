import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import './catalog.css';

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

const userCollection = collection(db, 'users');
const clothesCollection = collection(db, 'clothes');
const cartCollection = collection(db, 'shoppingCart');
const clothesSnapshot = await getDocs(clothesCollection);
let productsData = [];


const userId = await getUserId();

var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Change the icons inside the button based on previous settings
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
}

var themeToggleBtn = document.getElementById('theme-toggle');

themeToggleBtn.addEventListener('click', function() {

    // toggle icons inside button
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    // if set via local storage previously
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }

    // if NOT set via local storage previously
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
    
});


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
    const name = data.name;
    const price = data.price;
    const discount = data.discount;
    const image = data.image;
    const createAt = data.createAt;
    const isActivated = data.isActivated;

    const actualPrice = price * (100 - discount) / 100;

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
      productType: null,
      productGender: null,
      productSizes: null,
      discount,
      image,
      createAt,
      isActivated,
      actualPrice
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


//Создаем ClothData
async function createClothBlock(data, list) {
  try {
    let isFavourite = false;
    const clothesList = list;
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "flex justify-center items-center";
    clothesBlock.classList.add('inline-flex');
    clothesBlock.innerHTML = `
        <div class="clothContainer relative p-4 m-8 border border-4 border-gray-300 dark:border-gray-800 rounded-lg hover:shadow-lg hover:bg-gray-200 dark:hover:bg-gray-800" hidden>
            <a class="group cursor-pointer relative mb-2 block h-96 overflow-hidden rounded-lg shadow-lg lg:mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 bg-opacity-25">
              <div class="bg-white bg-opacity-50 absolute top-0 right-0 px-2 py-1"><p class="text-white fonr-normal text-base leading-4">${data.productSizes}</p></div>

              <div class="block absolute w-48 h-48 bottom-0 left-0 -mb-24 ml-3"
                style="background: radial-gradient(black, transparent 60%); transform: rotate3d(0, 0, 1, 20deg) scale3d(1, 0.6, 1); opacity: 0.2;">
              </div>
              <img loading="lazy" class="productImage p-4 h-94 w-80 object-cover object-center justify-center items-center transition duration-200 group-hover:scale-110" />
    
              <div class="absolute left-0 bottom-2 flex gap-2">
                <span class="discount rounded-r-lg bg-red-500 px-3 py-1.5 text-sm font-semibold uppercase tracking-wider text-white" hidden></span>
                <span class="isNew rounded-lg bg-white px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-gray-800" hidden></span>
              </div>
              <div class="bg-purple-400 bg-opacity-50 absolute bottom-0 right-0 px-2 py-1"><p class="text-white fonr-normal text-base leading-4">${data.productGender}</p></div>
            </a>
    
            <div class="flex items-start justify-between gap-2 px-2">
              <div class="flex flex-col">
                <a class="nameOne cursor-pointer text-lg font-bold text-gray-800 dark:text-white transition duration-100 hover:text-gray-500 lg:text-xl">${data.name}</a>
                <span class="clothTypeOne text-gray-500">${data.productType}</span>
              </div>
    
              <div class="flex flex-col items-end">
                <span class="priceOne font-bold text-gray-800 dark:text-white lg:text-lg"></span>
                <span class="discountPrice text-sm text-red-500 line-through"></span>
              </div>
            </div>
        <div/>
          `;
    
    clothesList.appendChild(clothesBlock);
    const clothContainer = clothesBlock.querySelector('.clothContainer');
    const priceElement = clothesBlock.querySelector('.priceOne');
    const discountElement = clothesBlock.querySelector('.discount');
    const discountPriceElement = clothesBlock.querySelector('.discountPrice');
    const isNewElement = clothesBlock.querySelector('.isNew');
    const imageElement = clothesBlock.querySelector('.productImage'); 


    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    const price = data.price;
    const discount = data.discount;
    if(discount != 0){
      discountElement.textContent = `-${discount}%`;
      discountElement.hidden = false;

      discountPriceElement.textContent = `₽ ${price}`;
      priceElement.textContent = `₽ ${price * (100 - discount) / 100}`;
    }else{
      priceElement.textContent = `₽ ${price}`;
    }

    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const createAt = new Date(data.createAt);
    
    if(createAt >= thirtyDaysAgo && createAt <= currentDate){
      isNewElement.textContent = 'Новинка'; 
      isNewElement.hidden = false;
    };

    clothContainer.hidden = false;
    if(!data.isActivated){clothContainer.classList.add('opacity-30'); return;}

      
    if(userId !== 'ALL'){
      const userDoc = doc(userCollection, userId);

    // Получаем текущие данные пользователя
    getDoc(userDoc).then((userDocSnapshot) => {
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        let favouritesClothesIds = userData.idFavourites || [];

        // Преобразуем идентификатор одежды в числовой формат
        const clothIdNumber = parseInt(data.id, 10);

        // Проверяем, содержит ли массив уже выбранный идентификатор одежды
        if (favouritesClothesIds.includes(clothIdNumber)) {
          isFavourite = true;
        }
      }})
    }

    clothesBlock.querySelector('.clothContainer').addEventListener('click', () => {
      localStorage.setItem('lastProductId', data.id)
      // Получаем значение из localStorage и проверяем, является ли оно массивом
      let lastProducts = localStorage.getItem('lastProducts');
      try {
        lastProducts = lastProducts ? JSON.parse(lastProducts) : [];
        if (!Array.isArray(lastProducts)) {
          throw new Error('lastProducts is not an array');
        }
      } catch (error) {
        console.error('Error parsing lastProducts from localStorage:', error);
        lastProducts = []; // Инициализируем как пустой массив, если возникла ошибка
      }
    
      // Удаляем существующий data.id, если он уже есть в массиве
      lastProducts = lastProducts.filter(productID => productID !== data.id);

      // Добавляем новый ID продукта и сохраняем только последние 5 ID
      lastProducts.push(data.id);
      lastProducts = lastProducts.slice(-5);
      localStorage.setItem('lastProducts', JSON.stringify(lastProducts));
      console.log(lastProducts)
      window.location.href = 'product_overview.html';
    });

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

async function addStyleToWardrobe(data){

  if(userId === 'ALL'){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя добавить стиль в гардероб для незарегистрированного пользователя",
    });
    return;
  }

  let idUser = userId;
  let name = data.name;
  let description = data.description;
  let idClothes = data.idClothes;
  let styleGender = data.styleGender;


  const newStyle = {
    name,
    description,
    idClothes,
    idUser,
    styleGender
  };

  const stylesCollection = collection(db, 'styles');
  await addDoc(stylesCollection, newStyle);

  let timerInterval;
  Swal.fire({
    title: "Стиль добавлен в гардероб!",
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
    /* Read more about handling dismissals below */
    if (result.dismiss === Swal.DismissReason.timer) {
      console.log("I was closed by the timer");
    }
  }); 
}

async function createProduct(data, list) {
  try {
    const clothesList = list;
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "relative";
    clothesBlock.innerHTML = `
    <div class="clothContainer p-4 rounded-lg hover:shadow-lg bg-gray-300 dark:bg-gray-800" hidden>
            <a class="group cursor-pointer relative mb-2 block h-64 overflow-hidden rounded-lg shadow-lg lg:mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 bg-opacity-25">
            <div class="bg-white bg-opacity-50 absolute top-0 right-0 px-2 py-1"><p class="text-white fonr-normal text-base leading-4">${data.productSizes}</p></div>

              <div class="block absolute w-48 h-48 bottom-0 left-0 -mb-24 ml-3"
                style="background: radial-gradient(black, transparent 60%); transform: rotate3d(0, 0, 1, 20deg) scale3d(1, 0.6, 1); opacity: 0.2;">
              </div>
              <img loading="lazy" class="productImage p-4 h-94 w-80 object-cover object-center object-scale-down justify-center items-center transition duration-200 group-hover:scale-110" />
    
              <div class="absolute left-0 bottom-2 flex gap-2">
                <span class="discount rounded-r-lg bg-red-500 px-3 py-1.5 text-sm font-semibold uppercase tracking-wider text-white" hidden></span>
                <span class="isNew rounded-lg bg-white px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-gray-800" hidden></span>
              </div>
              <div class="bg-purple-400 bg-opacity-50 absolute bottom-0 right-0 px-2 py-1"><p class="text-white fonr-normal text-base leading-4">${data.productGender}</p></div>
            </a>
    
            <div class="flex items-start justify-between gap-2 px-2">
              <div class="flex flex-col">
                <a class="nameOne cursor-pointer text-lg font-bold text-white transition duration-100 hover:text-gray-500 lg:text-xl">${data.name}</a>
                <span class="clothTypeOne text-gray-500">${data.productType}</span>
              </div>
    
              <div class="flex flex-col items-end">
                <span class="priceOne font-bold text-gray-100 lg:text-lg">$19.99</span>
                <span class="discountPrice text-sm text-red-500 line-through"></span>
              </div>
            </div>
        <div/>
    `;
    
    clothesList.appendChild(clothesBlock);
    const clothContainer = clothesBlock.querySelector('.clothContainer');
    const priceElement = clothesBlock.querySelector('.priceOne');
    const discountElement = clothesBlock.querySelector('.discount');
    const discountPriceElement = clothesBlock.querySelector('.discountPrice');
    const isNewElement = clothesBlock.querySelector('.isNew');
    const imageElement = clothesBlock.querySelector('.productImage'); 

    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    const price = data.price;
    const discount = data.discount;
    if(discount != 0){
      discountElement.textContent = `-${discount}%`;
      discountElement.hidden = false;

      discountPriceElement.textContent = `₽ ${price}`;
      priceElement.textContent = `₽ ${price * (100 - discount) / 100}`;
    }else{
      priceElement.textContent = `₽ ${price}`;
    }

    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const createAt = new Date(data.createAt);
    
    if(createAt >= thirtyDaysAgo && createAt <= currentDate){
      isNewElement.textContent = 'Новинка'; 
      isNewElement.hidden = false;
    };

    clothContainer.hidden = false;

    if(!data.isActivated){clothContainer.classList.add('opacity-30'); return;}

    clothesBlock.querySelector('.clothContainer').addEventListener('click', () => {
      localStorage.setItem('lastProductId', data.id)
      // Получаем значение из localStorage и проверяем, является ли оно массивом
      let lastProducts = localStorage.getItem('lastProducts');
      try {
        lastProducts = lastProducts ? JSON.parse(lastProducts) : [];
        if (!Array.isArray(lastProducts)) {
          throw new Error('lastProducts is not an array');
        }
      } catch (error) {
        console.error('Error parsing lastProducts from localStorage:', error);
        lastProducts = []; // Инициализируем как пустой массив, если возникла ошибка
      }
    
      // Удаляем существующий data.id, если он уже есть в массиве
      lastProducts = lastProducts.filter(productID => productID !== data.id);

      // Добавляем новый ID продукта и сохраняем только последние 5 ID
      lastProducts.push(data.id);
      lastProducts = lastProducts.slice(-5);
      localStorage.setItem('lastProducts', JSON.stringify(lastProducts));
    
      window.location.href = 'product_overview.html';
    });

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

async function populateList(data, userStyleClothes, styleId, index) {
  const stylesLists = document.getElementById('garderobStylesList');
  stylesLists.className = "container mx-auto p-4 justify-center items-center";

  // Создание уникального id для блока
  const blockId = `stylesBlock${index}`;

  // Блок со стилями гардероба
  const stylesBlock = document.createElement('div');
  stylesBlock.id = blockId;
  stylesBlock.className = "justify-center items-center my-4";
  stylesBlock.innerHTML = `
  <div class="rounded-lg bg-gray-200 border-gray-700 dark:bg-gray-900 dark:border-gray-400 border-4">
    <span class="isNew rounded-lg bg-white px-3 py-1.5 text-m font-bold uppercase tracking-wider text-gray-800 mt-8 ml-4" hidden></span>
    <div class="mx-auto grid max-w-2xl grid-cols-1 items-center px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:grid-cols-2 lg:px-8">

      <div class="p-8 rounded-lg bg-gray-300 dark:bg-gray-800">
        <h2 id="txtName" class="text-3xl font-bold tracking-tight text-purple-500 sm:text-4xl">${data.name}</h2>
        <p id="txtDescription" class="mt-4 text-gray-700 dark:text-gray-400">${data.description}</p>

        <dl class="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:gap-x-8">
          <div class="border-t border-gray-200 pt-4">
            <img alt="styleImage" class="img object-cover object-center">
          </div>
        </dl>
      </div>
      <div class="styleClothesList grid grid-cols-2 grid-rows-2 gap-4 sm:gap-6 lg:gap-8 p-4">
      </div>
    </div>
    <button id="addStyleToWardrobeButton" type="button" class="gradient py-2 px-4 mb-4 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-purple-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
    Добавить стиль в гардероб
  </button>
  </div>
  `;
  const imageElement = stylesBlock.querySelector('.img');
  const imagePath = data.image;
  const storageImageRef = ref(storage, `images/${imagePath}`);
  const imageUrl = await getDownloadURL(storageImageRef);
  imageElement.src = imageUrl;

  const styleClothesList = stylesBlock.querySelector('.styleClothesList');

  userStyleClothes.forEach((data) => {
    createProduct(data, styleClothesList);
  });

  const isNewElement = stylesBlock.querySelector('.isNew');
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const createAt = new Date(data.createAt);
  
  if(createAt >= thirtyDaysAgo && createAt <= currentDate){
    isNewElement.textContent = 'Новинка'; 
    isNewElement.hidden = false;
  };

  
  stylesLists.appendChild(stylesBlock);

  const addStyleToWardrobeButton = stylesBlock.querySelector('#addStyleToWardrobeButton');
  addStyleToWardrobeButton.addEventListener('click', () => {
    addStyleToWardrobe(data);
  });
}

async function getStyles(){
  let i = 0;
  const stylesBody = document.getElementById('garderobStylesList');
  stylesBody.innerHTML = '';

  // Запрос данных из коллекции shoppingCart для конкретного пользователя
  const stylesRef = collection(db, 'styles');
  // Запрос данных из коллекции shoppingCart для конкретного пользователя
  const userStylesItemsQuery = query(stylesRef, where('idUser', '==', 'ALL'));

  // Получение данных из запроса
  getDocs(userStylesItemsQuery).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      i += 1;
      // Доступ к данным каждого документа и вывод информации о каждом элементе одежды
      const data = doc.data();

      // Преобразуем идентификаторы в строковый формат
      const userStylesIds = data.idClothes.map(String);
      // Фильтруем данные об одежде по идентификаторам из коллекции clothes
      const userClothesData = productsData.filter((cloth) => userStylesIds.includes(cloth.id));
      
      populateList(data, userClothesData, doc.id,  i)
    });
  });
}




//Рендерим все найденное
async function renderClothes(products) {
  const clothesList = document.getElementById('clothesList')
  const emptySection = document.getElementById('emptySection')
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsToShow = products.slice(startIndex, endIndex);
  console.log(products.length)

  if(products.length == 0){ 
    clothesList.classList.add('hidden'); emptySection.classList.remove('hidden');}
  else{
    clothesList.classList.remove('hidden'); emptySection.classList.add('hidden');
    clothesList.innerHTML = ''; // Очищаем лист
    productsToShow.forEach((data) => {
      createClothBlock(data, clothesList);
    });
  }
}




async function applyFilters() {
  const selectedColors = Array.from(document.querySelectorAll('input[name^="color"]:checked')).map((checkbox) => checkbox.value);
  const selectedSizes = Array.from(document.querySelectorAll('input[name^="size"]:checked')).map((checkbox) => checkbox.value);
  const selectedMaterials = Array.from(document.querySelectorAll('input[name^="material"]:checked')).map((checkbox) => checkbox.value);

  filteredProducts = filteredProducts.filter((product) => {
    const hasSelectedColor = product.idColors.some((color) => selectedColors.includes(color.toString()));
    const hasSelectedSize = product.idSizes.some((size) => selectedSizes.includes(size.toString()));
    const hasSelectedMaterial = selectedMaterials.includes(product.idMaterial.toString());
    return hasSelectedColor && hasSelectedMaterial && hasSelectedSize;
  });

  currentPage = 1; // Сбрасываем текущую страницу на первую
  updatePageNumbers(filteredProducts.length);
  renderClothes(filteredProducts); // Обновляем список товаров
}


async function createFilter(name, value, type, section){
  const filterList = document.getElementById(section);
  const filterBlock = document.createElement('div');
  filterBlock.className = "flex items-center rounded";
  filterBlock.innerHTML = `
      <input checked id="filter-${type}-${name}" name="${type}[${name}]" value="${value}" type="checkbox" class="h-4 w-4 ml-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 rounded">
      <label for="filter-${type}-${name}" class="ml-3 text-sm text-gray-700 dark:text-gray-300">${name}</label>
    `;
    filterList.appendChild(filterBlock);
}

//Рендерим Фильтры
async function renderFilters() {
  const colorsList = document.getElementById('filter-section-color');
  colorsList.innerHTML = ''; // Очищаем лист
  const colorsCollection = collection(db, 'colors');
  const colorsSnapshot = await getDocs(colorsCollection);

  colorsSnapshot.forEach((document) => {
    const name = document.data().name;
    const value = document.id;
    createFilter(name, value, 'color', 'filter-section-color');
  });

  const materialsList = document.getElementById('filter-section-materials');
  materialsList.innerHTML = ''; // Очищаем лист
  const materialsCollection = collection(db, 'materials');
  const materialsSnapshot = await getDocs(materialsCollection);

  materialsSnapshot.forEach((document) => {
    const name = document.data().name;
    const value = document.id;
    createFilter(name, value, 'material', 'filter-section-materials');
  });

  const sizesList = document.getElementById('filter-section-sizes');
  sizesList.innerHTML = ''; // Очищаем лист
  const sizesCollection = collection(db, 'sizes');
  const sizesSnapshot = await getDocs(sizesCollection);

  sizesSnapshot.forEach((document) => {
    const name = document.data().name;
    const value = document.id;
    createFilter(name, value, 'size', 'filter-section-sizes');
  });

}

const applyFiltersButton = document.getElementById('applyFiltersButton');
applyFiltersButton.addEventListener('click', function(event) {
  event.preventDefault();
  applyFilters();
});


async function SortItems(param){
  
  const clothesCollection = collection(db, 'clothes');
  let q;

  if (param === 'noSort') {
    filteredProducts = filteredProducts.sort((a, b) => b.id - a.id);
  } else if (param === 'popular') {
    q = query(clothesCollection, orderBy('popularity', 'asc'));
  } else if (param === 'discount') {
    filteredProducts = filteredProducts.sort((a, b) => b.discount - a.discount);
  } else if (param === 'new') {
    filteredProducts = filteredProducts.sort((a, b) => new Date(b.createAt) - new Date(a.createAt));
  } else if (param === 'priceHighToLow') {
    filteredProducts = filteredProducts.sort((a, b) => a.actualPrice - b.actualPrice);
  } else if (param === 'priceLowToHigh') {
    filteredProducts = filteredProducts.sort((a, b) => b.actualPrice - a.actualPrice);
  }
  applyFilters();
}

// Получаем ссылки на элементы сортировки
const noSortItem = document.getElementById('sort-item-noSort');
const popularSortItem = document.getElementById('sort-item-popular');
const discountSortItem = document.getElementById('sort-item-discount');
const newSortItem = document.getElementById('sort-item-new');
const priceHighToLowSortItem = document.getElementById('sort-item-priceHighToLow');
const priceLowToHighSortItem = document.getElementById('sort-item-priceLowToHigh');

// Добавляем обработчики событий для каждого элемента сортировки
noSortItem.addEventListener('click', () => {
  // Выполняем запрос к базе данных для сортировки по популярности
  sortParameter = 'noSort';
  SortItems(sortParameter);
});

// Добавляем обработчики событий для каждого элемента сортировки
popularSortItem.addEventListener('click', () => {
  // Выполняем запрос к базе данных для сортировки по популярности
  // ...
});

discountSortItem.addEventListener('click', () => {
  // Выполняем запрос к базе данных для сортировки по лучшим
  sortParameter = 'discount';
  SortItems(sortParameter);
});

newSortItem.addEventListener('click', () => {
  // Выполняем запрос к базе данных для сортировки по новым
  sortParameter = 'new';
  SortItems(sortParameter);
});

priceHighToLowSortItem.addEventListener('click', () => {
  // Выполняем запрос к базе данных для сортировки по возрастанию цены
  sortParameter = 'priceHighToLow';
  SortItems(sortParameter);
});

priceLowToHighSortItem.addEventListener('click', () => {
  // Выполняем запрос к базе данных для сортировки по убыванию цены
  sortParameter = 'priceLowToHigh';
  SortItems(sortParameter);
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

  console.log(filteredProducts);
  applyFilters();
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


const toCartButton = document.getElementById('toCartButton');
toCartButton.addEventListener('click', function() {
  if(userId !== 'ALL') window.location.href = "cart.html"
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
});





const catalogStylesBlock = document.getElementById('catalogStylesBlock');
const catalogClothesBlock = document.getElementById('catalogClothesBlock');
// Функция для обработки выбора одежды
function handleClothesSelection() {
  catalogStylesBlock.hidden = true;
  catalogClothesBlock.hidden = false;
}

// Функция для обработки выбора стилей
function handleStylesSelection() {
  catalogStylesBlock.hidden = false;
  catalogClothesBlock.hidden = true;
}


// Получаем ссылки на кнопки
const clothesButton = document.getElementById('clothes');
const stylesButton = document.getElementById('styles');


// Добавляем обработчики событий для кнопок
clothesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Мужчина"
  clothesButton.classList.add('act');
  // Удаляем класс активности с кнопки "Женщина"
  stylesButton.classList.remove('act');
  console.log('выбрана одежда');
  handleClothesSelection();
});

stylesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Женщина"
  stylesButton.classList.add('act');
  // Удаляем класс активности с кнопки "Мужчина"
  clothesButton.classList.remove('act');
  console.log('выбраны стили');
  handleStylesSelection();
});



const filters = document.getElementById('filters');
const buttonShowFiltersMobile = document.getElementById('buttonShowFiltersMobile');

buttonShowFiltersMobile.addEventListener('click', function() {
  filters.classList.toggle('hidden');
});

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
  const userCartItemsQuery = query(cartCollection, where('idUser', '==', userId));
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

// Добавляем обработчики для кнопок пагинации
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderClothes(filteredProducts);
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  if ((currentPage * itemsPerPage) < filteredProducts.length) {
    currentPage += 1;
    renderClothes(filteredProducts);
  }
});

// Добавляем обработчики для кнопок пагинации
document.getElementById('prevPageTop').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderClothes(filteredProducts);
  }
});

document.getElementById('nextPageTop').addEventListener('click', () => {
  if ((currentPage * itemsPerPage) < filteredProducts.length) {
    currentPage += 1;
    renderClothes(filteredProducts);
  }
});

// Обновляем номера страниц
function updatePageNumbers(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById('paginationNumbers');
  paginationContainer.innerHTML = ''; // Очищаем текущие номера страниц

  for (let i = 1; i <= totalPages; i++) {
    const pageNumberElement = document.createElement('p');
    pageNumberElement.className = 'page-number text-sm font-medium leading-none cursor-pointer text-gray-400 hover:text-indigo-700 border-t border-transparent hover:border-indigo-400 pt-3 mr-4 px-2';
    pageNumberElement.textContent = i;
    pageNumberElement.addEventListener('click', () => {
      currentPage = i;
      renderClothes(filteredProducts);
    });
    paginationContainer.appendChild(pageNumberElement);
  }
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


let currentPage = 1;
const itemsPerPage = 4;

const _userId = await getUserId();

async function main(){
  productsData = await getProducts(clothesSnapshot);
  await renderClothes(productsData);
  filteredProducts = productsData;
  updatePageNumbers(filteredProducts.length)
  renderFilters();

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
  getStyles();
}

main()
import './catalog.css';
import { Modal } from 'flowbite'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import './catalog.css';

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

let selectedProducts = {
  'tops': null,
  'bottoms': null,
  'headdresses': null,
  'accessories': null,
};
const typeMappings = {
  'tops': ['1', '3', '5', '7'],
  'bottoms': ['2', '4', '6'],
  'headdresses': ['8', '9', '10', '13'],
  'accessories': ['11']
};

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

let filteredProducts = [];

let tops = [];
let bottoms = [];
let accessories = [];
let headdresses = [];

let selectedParameters = {
  gender: 'Мужская',
  colors: [],
  sizes: [],
  price: 10000,
  products: []
}

const userId = await getUserId();

const $modalElement = document.getElementById('crud-modal');
const modal = new Modal($modalElement);

// Получение всех фотографий и контента 
const dragItems = document.querySelectorAll('.product-image');
const dragContent = document.getElementById('dragContent');

// Настройка элементов
let currentDragItem = null;
let initialMouseOffset = { x: 0, y: 0 };
let initialDragItemPosition = { x: 0, y: 0 };
let dragOrder = Array.from(dragItems);

// Назначение событий перемещения фотографиям
dragItems.forEach(item => {
  item.addEventListener('mousedown', startDrag); // Добавляем обработчик mousedown
  item.addEventListener('touchstart', startDrag); // Добавляем обработчик touchstart
  item.addEventListener('mouseup', stopDrag); //Добавляем обработчик mouseup
  item.addEventListener('touchend', stopDrag); // Добавляем обработчик touchend
});

// 
function startDrag(event) {
  event.preventDefault(); // Предотвращаем стандартное поведение браузера
  if (event.type === 'touchstart') {
    event = event.changedTouches[0]; // Получаем первое касание для touchstart и mouseup
  }
  currentDragItem = event.target.closest('.product-image');
  initialMouseOffset = {
    x: event.clientX - currentDragItem.offsetLeft,
    y: event.clientY - currentDragItem.offsetTop
  };
  initialDragItemPosition = {
    x: currentDragItem.offsetLeft,
    y: currentDragItem.offsetTop
  };
  // Обновление порядка элементов
  dragOrder = dragOrder.filter(item => item !== currentDragItem);
  dragOrder.push(currentDragItem);
  // Обновление z-index в соответствии с порядком
  dragOrder.forEach((item, index) => {
    item.style.zIndex = index + 1;
  });
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag); // Добавляем обработчик touchmove
}

// Функция перемещения
function drag(event) {
  event.preventDefault(); // Предотвращаем стандартное поведение браузера
  if (!currentDragItem) return;
  if (event.type === 'touchmove') {
    event = event.changedTouches[0]; // Получаем первое касание для touchmove
  }
  let newLeft = event.clientX - initialMouseOffset.x;
  let newTop = event.clientY - initialMouseOffset.y;

  // Ограничение перемещения фотографий границами контейнера
  newLeft = Math.max(0, Math.min(newLeft, dragContent.offsetWidth - currentDragItem.offsetWidth));
  newTop = Math.max(0, Math.min(newTop, dragContent.offsetHeight - currentDragItem.offsetHeight));

  currentDragItem.style.left = newLeft + 'px';
  currentDragItem.style.top = newTop + 'px';
}

// ОстановКа перемещения 
function stopDrag() {
  if (!currentDragItem) return;
  // Обновление порядка элементов
  dragOrder = dragOrder.filter(item => item !== currentDragItem);
  dragOrder.push(currentDragItem);
  // Обновление z-index в соответствии с порядком
  dragOrder.forEach((item, index) => {
    item.style.zIndex = index + 1;
  });
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('touchmove', drag); // Удаляем обработчик touchmove
  currentDragItem = null;
}


let checkout = document.getElementById("checkout");
let checdiv = document.getElementById("chec-div");
const asideHandler = (par) => {
  if (!par) {
    checkout.classList.add("translate-x-full");
    checkout.classList.remove("translate-x-0");
    setTimeout(function () {
      checdiv.classList.add("hidden");
    }, 1000);
  } else {
    setTimeout(function () {
      checkout.classList.remove("translate-x-full");
      checkout.classList.add("translate-x-0");
    }, 1000);
    checdiv.classList.remove("hidden");
  }
};

let currentProductType = null;
let currentImage = null;
let currentGender = null;

//Функция убрать товар
function hideProduct(productType) {
  if (currentImage) {
    currentImage.hidden = true;
    selectedProducts[productType] = null;
    asideHandler(false);
  }
}

let resizeCount = 0;

function handleImageSizeChange(action) {
  if (currentImage) {
    const currentWidth = currentImage.offsetWidth;
    const currentHeight = currentImage.offsetHeight;
    let newWidth, newHeight;

    if (action === 'increase' && resizeCount < 6) {
      newWidth = currentWidth * 1.1;
      newHeight = currentHeight * 1.1;
      resizeCount++;
    } else if (action === 'reduce' && resizeCount > -6) {
      newWidth = currentWidth * 0.9;
      newHeight = currentHeight * 0.9;
      resizeCount--;
    }

    currentImage.style.width = `${newWidth}px`;
    currentImage.style.height = `${newHeight}px`;
  }
}

increaseButton.addEventListener('click', () => handleImageSizeChange('increase'));

reduceButton.addEventListener('click', () => handleImageSizeChange('reduce'));

hideButton.addEventListener('click', () => hideProduct(currentProductType));

// Функция показа подробной информации о товаре при двойном щелчке 
async function showProductInterface(product, imageUrl, productTypeName){
  const name = document.getElementById('nameText');
  const type = document.getElementById('typeText');
  const colors = document.getElementById('colorsText');
  const sizes = document.getElementById('sizesText');
  const price = document.getElementById('priceText');
  const oldPrice = document.getElementById('oldPriceText');
  const imageAside = document.getElementById('imageAside');

  imageAside.src = imageUrl;

  const priceValue = product.price;
  const discount = product.discount;
  if(discount != 0){
    oldPrice.hidden = false;

    oldPrice.textContent = `₽ ${priceValue}`;
    price.textContent = `₽ ${priceValue * (100 - discount) / 100}`;
  }else{
    price.textContent = `₽ ${priceValue}`;
  }

  name.textContent = product.name;
  type.textContent = product.productType;
  colors.textContent = product.productColors;
  sizes.textContent = product.productSizes;

}

// Функция доавления товара в конструктор стилей
function addProductToCounstructor(product, imageUrl){
  const type = product.typeId;
  const gender = product.productGender;

  if (currentGender !== gender) {
    currentGender = gender;

    const dragItems = document.querySelectorAll('.product-image');
    dragItems.forEach(item => {
      item.hidden = true
    });
  }

  let productType = Object.keys(typeMappings).find(key => typeMappings[key].includes(type));

  if (!productType) { return; }

  const image = document.getElementById(`${productType}Image`);
  image.src = imageUrl;
  image.hidden = false;

  selectedProducts[productType] = product.id;

  image.addEventListener('dblclick', async function(){
    currentProductType = productType;
    currentImage = image;
    resizeCount = 0;
    await showProductInterface(product, imageUrl, productType);
    asideHandler(true);
  });
  image.addEventListener('touchcancel', async function(){
    currentProductType = productType;
    currentImage = image;
    resizeCount = 0;
    await showProductInterface(product, imageUrl, productType);
    asideHandler(true);
  });
}

// Получение размеров
async function getProductSizes(sizeRefs) {
  const sizeSnapshots = await Promise.all(sizeRefs.map((sizeRef) => getDoc(sizeRef)));
  const sizes = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name).join(', ');
  return sizes;
}

// получение цветов
async function getProductColors(colorRefs) {
  const colorSnapshots = await Promise.all(colorRefs.map((colorRef) => getDoc(colorRef)));
  const colors = colorSnapshots.map((colorSnapshot) => colorSnapshot.data().name).join(', ');
  return colors;
}

// получение типа
async function getProductTypeName(productTypeRef) {
  const productTypeSnapshot = await getDoc(productTypeRef);
  const productTypeValue = productTypeSnapshot.data().name;
  return productTypeValue;
}

// Получение значения мужская/женская
async function getProductGenderName(clothTypeRef) {
  const clothTypeSnapshot = await getDoc(clothTypeRef);
  const clothTypeValue = clothTypeSnapshot.data().name;
  return clothTypeValue;
}

// Получение данных товара
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

    const sizeRefs = idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));
    const colorRefs = idColors.map((colorId) => doc(db, 'colors', colorId.toString()));

    const productTypeRef = doc(db, 'clothType', data.idClothType.toString());
    const typeId = data.idClothType;
    const productGenderNameRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());

    promises.push(getProductTypeName(productTypeRef));
    promises.push(getProductGenderName(productGenderNameRef));
    promises.push(getProductSizes(sizeRefs));
    promises.push(getProductColors(colorRefs));


    neededData.push({
      idColors,
      idMaterial,
      idSizes,
      id,
      typeId,
      name,
      price,
      productType: null,
      productGender: null,
      productSizes: null,
      productColors: null,
      discount,
      image,
      createAt
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


//Создаем блоки товаров на странице
async function createClothBlock(data, list) {
  try {
    const clothesList = document.getElementById(list);
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "flex flex-shrink-0 justify-center items-center";
    clothesBlock.classList.add('inline-flex');
    clothesBlock.innerHTML = `
        <div class="clothContainer p-4 m-2 border border-4 border-gray-300 dark:border-gray-800 rounded-lg hover:shadow-lg hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer" hidden>
            <a class="group main-background relative mb-2 block h-96 overflow-hidden rounded-lg shadow-lg lg:mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 bg-opacity-25">
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
                <a class="nameOne text-lg font-bold text-gray-900 dark:text-white transition duration-100 hover:text-gray-500 lg:text-xl">${data.name}</a>
                <span class="clothTypeOne text-gray-500">${data.productType}</span>
              </div>
    
              <div class="flex flex-col items-end">
                <span class="priceOne font-bold text-gray-800 dark:text-gray-100 lg:text-lg">$19.99</span>
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
    const background = clothesBlock.querySelector('.main-background'); 
    if(data.productGender === 'Мужская'){
      background.className = 'group main-background relative mb-2 block h-96 overflow-hidden rounded-lg shadow-lg lg:mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 bg-opacity-25';
    }
    else{
      background.className = 'group main-background relative mb-2 block h-96 overflow-hidden rounded-lg shadow-lg lg:mb-3 bg-gradient-to-r from-purple-600 to-purple-900 bg-opacity-25';
    }

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

    clothesBlock.querySelector('.clothContainer').addEventListener('click', () => {
      addProductToCounstructor(data, imageUrl);
    });
    clothContainer.hidden = false;

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

// Обработчик кнопки добавления стиля
const saveStyleButton = document.getElementById('saveStyleButton');
saveStyleButton.addEventListener('click', function(){
  // Проверка, что есть хотя бы два элемента не null
  let nonNullCount = 0;
  for (let key in selectedProducts) {
    if (selectedProducts[key] !== null) {
      nonNullCount++;
      if (nonNullCount >= 2) {
        break;
      }
    }
  }

  if (nonNullCount >= 2) {
    addStyle(selectedProducts);
  } else {
    showAlert("Чтобы создать стиль, необходимо минимум 2 элемента!")
  }
});

// Функция добавления стиля
async function addStyle(selectedProducts){

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
          const date = new Date();
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const styleCreateAt = `${month}.${day}.${year}`;

          const currentStyleGender = currentGender === 'Мужская' ? 'Мужской' : 'Женский';
    
          const newStyle = {
            name: selectedName,
            description: selectedDescription,
            idClothes: Array.from(Object.values(selectedProducts)).filter(value => value !== null),
            idUser: userId,
            styleGender: currentStyleGender,
            createAt: styleCreateAt,
          };
    
          const stylesCollection = collection(db, 'styles');
          await addDoc(stylesCollection, newStyle);
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


//Рендерим товары
async function renderClothes(products, list) {
  const productList = document.getElementById(list);
  productList.innerHTML = '';
  products.forEach((data) => {
    createClothBlock(data, list);
  });
}


// Фильтрация товаров по типу
async function filterProducts(type){
  const types = typeMappings[type] || [];

  const productsCollection = collection(db, 'clothes');
  const q = query(productsCollection, where('idClothType', 'in', types));
  const querySnapshot = await getDocs(q);

  return querySnapshot;
}

//Создаем блок товара в модаьном окне
async function createSurveyProductBlock(data, list) {
  try {
    const clothesBlock = document.createElement('div');
    clothesBlock.hidden = true
    clothesBlock.className = "w-48 bg-white shadow-md rounded-xl duration-500 hover:shadow-xl";
    clothesBlock.innerHTML = `
      <div class="productContainer">
        <img alt="Product" class="productImage h-48 mt-1 w-full rounded-t-xl object-center object-scale-down justify-center items-center transition duration-200" />
        <div class="px-4 py-3 w-48">
            <span class="text-gray-400 mr-3 uppercase text-xs">${data.productType}</span>
            <p class="text-lg font-bold text-black truncate block capitalize">${data.name}</p>
            <div class="hidden product-selected flex items-center justify-center">
                <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
        </div>
      </div>
    `;
    
    const imageElement = clothesBlock.querySelector('.productImage');
    const productSelected = clothesBlock.querySelector('.product-selected');

    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    clothesBlock.addEventListener('click', () => {
      if (selectedParameters.products.includes(data.id)) {
        selectedParameters.products = selectedParameters.products.filter(id => id !== data.id);
      } else {
        selectedParameters.products.push(data.id);
      }
      productSelected.classList.toggle('hidden');
      clothesBlock.classList.toggle('scale-105');
    });

    list.appendChild(clothesBlock);

    clothesBlock.hidden = false;

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

//Рендерим товары в модальном окне
async function renderSurveyProducts(products, count = 6) {
  console.log(selectedParameters)
  const productList = document.getElementById('offeredProductsList');
  productList.innerHTML = '';
  const neededProducts = products.sort(() => 0.5 - Math.random()).slice(0, count);

  neededProducts.forEach((data) => {
    createSurveyProductBlock(data, productList);
  });
}

// Показ фильтров цветов или размеров
async function createSurveySelectFilter(name, id, type, filterList){
  const filterBlock = document.createElement('div');
  filterBlock.className = "px-2 w-1/4";
  filterBlock.innerHTML = `
    <label for="${type}-${name}" class="block text-gray-600 font-medium mb-2">
        <input type="checkbox" id="${type}${id}" name="${type}[${name}]" value=${id} class="mr-2 text-gray-800">${name}
    </label>
  `;

  filterBlock.addEventListener('change', function(){
    applyFilters();
  });

  filterList.appendChild(filterBlock);
}

// Создание фильтров цветов или размеров
async function showSurveySelect(selectCollection){
  const list = document.getElementById(`${selectCollection}Select`);
  list.innerHTML = '';
  const filterCollection = collection(db, selectCollection);
  const snapshot = await getDocs(filterCollection);

  snapshot.forEach((document) => {
    const name = document.data().name;
    const id = document.id;
    createSurveySelectFilter(name, id, selectCollection, list);
  });
}

// Функция применеия фильтров
async function applyFilters() {
  const products = productsData;

  const selectedColors = Array.from(document.querySelectorAll('input[name^="colors"]:checked')).map((checkbox) => checkbox.value);
  const selectedSizes = Array.from(document.querySelectorAll('input[name^="sizes"]:checked')).map((checkbox) => checkbox.value);

  const isAtLeastOneColorSelected = selectedColors.some((color) => color !== '');
  const isAtLeastOneSizeSelected = selectedSizes.some((size) => size !== '');

  const gender = selectedParameters.gender;

  if(isAtLeastOneColorSelected && isAtLeastOneSizeSelected){
    
    selectedParameters.colors = selectedColors;
    selectedParameters.sizes = selectedSizes;

    filteredProducts = products.filter((product) => {
      const hasSelectedColor = product.idColors.some((color) => selectedColors.includes(color.toString()));
      const hasSelectedSize = product.idSizes.some((size) => selectedSizes.includes(size.toString()));
      const isMatchingGender = product.productGender.includes(gender);
      return hasSelectedColor && hasSelectedSize && isMatchingGender;
    });
    //console.log(filteredProducts)
    renderSurveyProducts(filteredProducts);
  }
}

const genderSelect = document.getElementById('gender');
genderSelect.addEventListener('change', function() {
  const selectedValue = this.value;
  selectedParameters.gender = selectedValue;
  applyFilters();
});

const priceSelect = document.getElementById('price');
priceSelect.addEventListener('change', function() {
  const selectedValue = this.value;
  selectedParameters.price = selectedValue;
  applyFilters();
});

// Создание блока стиля
async function createCreatedStyleBlock(data, list, index){
  try {
    console.log(`Создаем ${index} стиль..`);
    const styleBlock = document.createElement('div');
    styleBlock.hidden = true;
    styleBlock.className = "mb-16 space-y-4";
    styleBlock.innerHTML = `
      <h2 class="mb-2 text-2xl font-semibold dark:text-gray-200 text-gray-800">Стиль ${index}:</h2>
      <dl class="w-full text-gray-300 divide-y divide-gray-200 dark:text-white dark:divide-gray-700">
        <div class="tops flex flex-col pb-3">
            <dt class="mb-1 text-purple-500 md:text-xl">Верх</dt>
            <dd class="text-lg font-semibold flex items-center space-x-4 rtl:space-x-reverse">
              <img class="topsImage w-8 h-8 object-center object-cover rounded-full" src="images/w-T.png" alt="TopsImg">
              <p class="topsName dark:text-gray-300 text-gray-700" ></p>
            </dd>
        </div>
        <div class="bottoms flex flex-col py-3">
            <dt class="mb-1 text-purple-500 md:text-xl">Низ</dt>
            <dd class="text-lg font-semibold flex items-center space-x-4 rtl:space-x-reverse">
              <img class="bottomsImage w-8 h-8 object-center object-cover rounded-full" src="images/w-T.png" alt="BottomsImg">
              <p class="bottomsName dark:text-gray-300 text-gray-700" ></p>
            </dd>
        </div>
        <div class="headdresses flex flex-col py-3">
          <dt class="mb-1 text-purple-500 md:text-xl">Головной убор</dt>
          <dd class="text-lg font-semibold flex items-center space-x-4 rtl:space-x-reverse">
            <img class="headdressesImage w-8 h-8 object-center object-cover rounded-full" src="images/w-T.png" alt="HeadImg">
            <p class="headdressesName dark:text-gray-300 text-gray-700" ></p>
          </dd>
        </div>
        <div class="accessories flex flex-col pt-3">
          <dt class="mb-1 text-purple-500 md:text-xl">Аксессуар</dt>
          <dd class="text-lg font-semibold flex items-center space-x-4 rtl:space-x-reverse">
            <img class="accessoriesImage w-8 h-8 object-center object-cover rounded-full" src="images/w-T.png" alt="AccesImg">
            <p class="accessoriesName dark:text-gray-300 text-gray-700" ></p>
          </dd>
        </div>
      </dl>
      <button type="button" class="lookStyleButton w-full text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
        Посмотреть</button>
    `;

    const promises = Object.keys(data).map(async (key) => {
      const productId = data[key];
      const product = await getProductById(productId);
      const storageImageRef = ref(storage, `images/${product.image}.png`);
      return getDownloadURL(storageImageRef).then((imageUrl) => {
        return { key, imageUrl, name: product.name };
      });
    });

    const results = await Promise.all(promises);

    results.forEach(({ key, imageUrl, name }) => {
      styleBlock.querySelector(`.${key}Image`).src = imageUrl;
      styleBlock.querySelector(`.${key}Name`).textContent = name;
    });

    styleBlock.querySelector('.lookStyleButton').addEventListener('click', async function(){
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const productId = data[key];
            const product = await getProductById(productId);
  
            const storageImageRef = ref(storage, `images/${product.image}.png`);
            const imageUrl = await getDownloadURL(storageImageRef);
            
            addProductToCounstructor(product, imageUrl)
        }
      }
    })

    styleBlock.hidden = false;

    list.appendChild(styleBlock);

  } catch (error) {
    console.error("Error adding style:", error);
  }
}

// Рендер созданных стилей
function renderCreatedStyles(createdStyles){
  const createdStylesList = document.getElementById('createdStylesList');
  createdStylesList.innerHTML = ``;

  let index = 1;
  createdStyles.forEach((data) => {
    createCreatedStyleBlock(data, createdStylesList, index);
    index += 1;
  });
  stylesHandler(true);
}

// Функция для фильтрации продуктов по типу и полу
async function filterProductsByGenderAndType(gender, type) {
  const genderId = gender === 'Мужская' ? '1' : '2';
  const types = typeMappings[type] || [];
  const productsCollection = collection(db, 'clothes');
  const q = query(productsCollection, where('idClothType', 'in', types), where('idClothTypeGender', '==', genderId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id, // Получаем идентификатор документа
    ...doc.data() // Получаем данные документа
  }));
}

// Функция для проверки соответствия продукта выбранным параметрам
async function productMatchesParameters(product, selectedParameters) {
  return selectedParameters.colors.includes(product.idColors) &&
         selectedParameters.sizes.includes(product.idSizes) &&
         selectedParameters.price >= product.price;
}

// Фуекция созданиия стиля для товара
async function createStyleForProduct(productId, selectedParameters) {
  let selectedProducts = {
    'tops': null,
    'bottoms': null,
    'headdresses': null,
    'accessories': null,
  };

  // Получение данных выбранного продукта и определение его категории параллельно
  const [selectedProduct, productTypes] = await Promise.all([
    getProductById(productId),
    Object.keys(selectedProducts)
  ]);

  const selectedIdClothType = selectedProduct.typeId;
  const selectedProductType = productTypes.find(type =>
    typeMappings[type].includes(selectedIdClothType)
  );

  // Создание массива с типами продуктов, кроме выбранного
  const otherProductTypes = productTypes.filter(type => type !== selectedProductType);

  // Получение продуктов для каждого типа параллельно
  const productPromises = otherProductTypes.map(type =>
    filterProductsByGenderAndType(selectedParameters.gender, type)
  );

  const productsByType = await Promise.all(productPromises);

  // Фильтрация и выбор продуктов
  productsByType.forEach((products, index) => {
    const matchingProducts = products.filter(product =>
      productMatchesParameters(product, selectedParameters)
    );
    const type = otherProductTypes[index];
    selectedProducts[type] = matchingProducts.length > 0 ? matchingProducts[Math.floor(Math.random() * matchingProducts.length)].id : null;
  });

  // Добавление выбранного продукта
  selectedProducts[selectedProductType] = productId;

  console.log(`Стиль для продукта с ID ${productId}:`, selectedProducts);
  return selectedProducts;
}

// Функция для получения продукта по ID
async function getProductById(productId) {
  const docRef = doc(db, 'clothes', productId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const idColors = data.idColors;
    const idMaterial = data.idMaterial;
    const idSizes = data.idSizes;
    const name = data.name;
    const price = data.price;
    const discount = data.discount;
    const image = data.image;
    const createAt = data.createAt;

    const sizeRefs = idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));
    const colorRefs = idColors.map((colorId) => doc(db, 'colors', colorId.toString()));

    const productTypeRef = doc(db, 'clothType', data.idClothType.toString());
    const typeId = data.idClothType;
    const productGenderNameRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());

    const productType = await getProductTypeName(productTypeRef);
    const productGender = await getProductGenderName(productGenderNameRef);
    const productSizes = await getProductSizes(sizeRefs);
    const productColors = await getProductColors(colorRefs);

    return {
      idColors,
      idMaterial,
      idSizes,
      id: docSnap.id,
      typeId,
      name,
      price,
      productType,
      productGender,
      productSizes,
      productColors,
      discount,
      image,
      createAt
    };
  } else {
    console.log('Нет такого продукта!');
    return null;
  }
}

//Функция проверки заполнения полей
function areAllPropertiesFilled(selectedParameters) {
  return (
    selectedParameters.gender !== '' &&
    selectedParameters.colors.length > 0 &&
    selectedParameters.sizes.length > 0 &&
    selectedParameters.price !== 0 &&
    selectedParameters.products.length > 0
  );
}

// Обработчик для кнопки Подобрать стиль
const submitButton = document.getElementById('submitButton');
submitButton.addEventListener('click', async function(event) {
  event.preventDefault();
  if (areAllPropertiesFilled(selectedParameters)) {
    const stylePromises = selectedParameters.products.map(productId =>
      createStyleForProduct(productId, selectedParameters)
    );

    const createdStyles = await Promise.all(stylePromises);

    modal.hide();

    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.remove("hidden");
    renderCreatedStyles(createdStyles);
    loadingScreen.classList.add("hidden");
  } else {
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Вы выбрали не все!",
    });
  }
});

// Обработчик кнопки открытия модального окна
const openStyleCreatorButton = document.getElementById('openStyleCreatorButton');
openStyleCreatorButton.addEventListener('click', async function(event) {
  event.preventDefault();
  modal.show();
});

// обработчик кнопки открытия модального окна в блоке стилей
const openStyleCreatorSideBarButton = document.getElementById('openStyleCreatorSideBarButton');
openStyleCreatorSideBarButton.addEventListener('click', async function(event) {
  event.preventDefault();
  stylesHandler(false);
  modal.show();
});

let style = document.getElementById("style");
let stylediv = document.getElementById("style-div");
const stylesHandler = (flag) => {
  if (flag) {
    // Изменяем классы для анимации появления сайдбара
    style.classList.remove("translate-x-[-100%]");
    style.classList.add("translate-x-0");
    stylediv.classList.remove("hidden");
    flag = false;
  } else {
    // Изменяем классы для анимации скрытия сайдбара
    style.classList.remove("translate-x-0");
    style.classList.add("translate-x-m100");
    setTimeout(function () {
      stylediv.classList.add("hidden");
    }, 700);
    flag = true;
  }
};

// Функции шапки
async function getCartItemsCount(idUser){
  const cartQuery = query(cartCollection, where('idUser', '==', idUser));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}

const notEmptyCartBlock = document.getElementById('notEmptyCartBlock');
const emptyCartBlock = document.getElementById('emptyCartBlock');
const cartModalList = document.getElementById('cartModalList');

function handleEmptyCart() {
  notEmptyCartBlock.hidden = true;
  emptyCartBlock.hidden = false;
}

function handleNotEmptyCart() {
  notEmptyCartBlock.hidden = false;
  emptyCartBlock.hidden = true;
}

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
        /* Read more about handling dismissals below */
        if (result.dismiss === Swal.DismissReason.timer) {
          console.log("I was closed by the timer");
        }
      }); 
}

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

// Главная функция
async function main(){

  productsData = await getProducts(clothesSnapshot);

  // Создание фильтров
  showSurveySelect('colors');
  showSurveySelect('sizes');

  // Завершение загрузки
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");
  // Открытие модального окна
  modal.show();

  // Получение товаров по категориям
  const topsSnapshot = await filterProducts('tops');
  tops = await getProducts(topsSnapshot);
  const bottomsSnapshot = await filterProducts('bottoms');
  bottoms = await getProducts(bottomsSnapshot);
  const headdressesSnapshot = await filterProducts('headdresses');
  headdresses = await getProducts(headdressesSnapshot);
  const accessoriesSnapshot = await filterProducts('accessories');
  accessories = await getProducts(accessoriesSnapshot);

  // Рендеринг товаров
  renderClothes(tops, 'topsList');
  renderClothes(bottoms, 'bottomsList');
  renderClothes(headdresses, 'headdressesList');
  renderClothes(accessories, 'accessoriesList');

  

  await getCartItemsCount(userId).then(count => {
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
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { Modal } from 'flowbite';

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
const usersCollection = collection(db, 'users');
const stylesCollection = collection(db, 'styles');
const cartCollection = collection(db, 'shoppingCart');
const clothesCollection = collection(db, 'clothes');

const email = document.getElementById('floating_email');
const password = document.getElementById('floating_password');
const repeatPassword = document.getElementById('floating_repeat_password');
const surname = document.getElementById('floating_surname');
const name = document.getElementById('floating_name');
const phone = document.getElementById('floating_phone');

// set the modal menu element
const $targetEl = document.getElementById('modalEl');
// options with default values
const options = {
  placement: 'center',
  backdrop: 'dynamic',
  backdropClasses:
      'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
  closable: true,
  onHide: () => {
      console.log('modal is hidden');
  },
  onShow: () => {
      console.log('modal is shown');
  },
  onToggle: () => {
      console.log('modal has been toggled');
  },
};

// instance options object
const instanceOptions = {
id: 'modalEl',
override: true
};
const modal = new Modal($targetEl, options, instanceOptions);



async function getStyles(snapshot){

  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const name = data.name;
    const description = data.description;
    const price = data.price;
    const styleGender = data.styleGender;
    const idUser = data.idUser;
    const idClothes = data.idClothes;
    const image = data.image;
    const uses = data.uses;
    const createAt = data.createAt;

    neededData.push({
      id,
      name,
      description,
      price,
      styleGender,
      idUser,
      idClothes,
      image,
      uses,
      createAt
    });
  });

  return neededData;
}

async function getProductName(productId){
  const clothesCollection = collection(db, 'clothes');
  const docRef = doc(clothesCollection, productId);
  const docSnapshot = await getDoc(docRef);
  
  if (docSnapshot.exists()) {
    const productName = docSnapshot.data().name;
    return productName;
  } else {
    return '';
  }
}
async function getProductDescription(productId){
  const clothesCollection = collection(db, 'clothes');
  const docRef = doc(clothesCollection, productId);
  const docSnapshot = await getDoc(docRef);
  
  if (docSnapshot.exists()) {
    const productName = docSnapshot.data().description;
    return productName;
  } else {
    return '';
  }
}

async function getProductType(productId){
  try {
    const clothesCollection = collection(db, 'clothes');
    const typesCollection = collection(db, 'clothType');
    const docRef = doc(clothesCollection, productId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const idClothType = docSnapshot.data().idClothType;
      const typeRef = doc(typesCollection, idClothType);
      const typeSnapshot = await getDoc(typeRef);

      if (typeSnapshot.exists()) {
        return typeSnapshot.data().name || '';
      }
    }
  } catch (error) {
    console.error('Error getting product type:', error);
  }

  return '';
}

async function getProductImage(productId){
  const clothesCollection = collection(db, 'clothes');
  const docRef = doc(clothesCollection, productId);
  const docSnapshot = await getDoc(docRef);
  
  if (docSnapshot.exists()) {
    const imagePath = docSnapshot.data().image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    return imageUrl;
  } else {
    return '';
  }
}

//Создаем Таблицу
async function createStyleBlock(data, stylesBody) {
  try {
    const styleBlock = document.createElement('section');
    styleBlock.className = "text-gray-400 body-font bg-gray-200 dark:bg-gray-900 rounded-lg my-2";

    styleBlock.innerHTML = `<div class="container px-5 py-24 mx-auto relative">
      <button class="deleteStyleButton absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
      <div class="flex flex-wrap w-full mb-20">
        <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
          <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">${data.name}</h1>
          <div class="h-1 w-20 bg-purple-500 rounded"></div>
        </div>
        <div class="lg:w-1/2 w-full mb-6 lg:mb-0 flex flex-row items-center">
          <div class="w-1 h-20 bg-purple-500 rounded mr-4 order-2 lg:order-1"></div>
          <p class="lg:w-1/2 w-full leading-relaxed text-gray-800 dark:text-gray-400 text-opacity-90 order-1 lg:order-2">${data.description}</p>
        </div>
      </div>
      <div class="flex flex-wrap -m-4">
          <div class="product1 xl:w-1/4 md:w-1/2 p-4 relative" hidden>
          <div class="bg-gray-300 dark:bg-gray-800 bg-opacity-40 p-6 rounded-lg">
            <img class="bg-cover productImage1 h-full w-full object-cover object-center mb-6" src="https://dummyimage.com/720x400" alt="content">
            <h3 class="productType1 tracking-widest text-purple-400 text-xs font-medium title-font">SUBTITLE</h3>
            <h2 class="productName1 text-lg text-gray-900 dark:text-white font-medium title-font mb-4">Chichen Itza</h2>
            <p class="productDescription1 leading-relaxed text-sm text-gray-600 dark:text-gray-400">Fingerstache flexitarian street art 8-bit waistcoat. Distillery hexagon disrupt edison bulbche.</p>
          </div>
        </div>
        <div class="product2 xl:w-1/4 md:w-1/2 p-4 relative" hidden>
          <div class="bg-gray-300 dark:bg-gray-800 bg-opacity-40 p-6 rounded-lg">
            <img class="bg-cover productImage2 h-full w-full object-cover object-center mb-6" src="https://dummyimage.com/721x401" alt="content">
            <h3 class="productType2 tracking-widest text-purple-400 text-xs font-medium title-font">SUBTITLE</h3>
            <h2 class="productName2 text-lg text-gray-900 dark:text-white  font-medium title-font mb-4">Colosseum Roma</h2>
            <p class="productDescription2 leading-relaxed text-sm text-gray-600 dark:text-gray-400">Fingerstache flexitarian street art 8-bit waistcoat. Distillery hexagon disrupt edison bulbche.</p>
          </div>
        </div>
        <div class="product3 xl:w-1/4 md:w-1/2 p-4 relative" hidden>
          <div class="bg-gray-300 dark:bg-gray-800 bg-opacity-40 p-6 rounded-lg">
            <img class="bg-cover productImage3 h-full w-full object-cover object-center mb-6" src="https://dummyimage.com/722x402" alt="content">
            <h3 class="productType3 tracking-widest text-purple-400 text-xs font-medium title-font">SUBTITLE</h3>
            <h2 class="productName3 text-lg text-gray-900 dark:text-white  font-medium title-font mb-4">Great Pyramid of Giza</h2>
            <p class="productDescription3 leading-relaxed text-sm text-gray-600 dark:text-gray-400">Fingerstache flexitarian street art 8-bit waistcoat. Distillery hexagon disrupt edison bulbche.</p>
          </div>
        </div>
        <div class="product4 xl:w-1/4 md:w-1/2 p-4 relative" hidden>
          <div class="bg-gray-300 dark:bg-gray-800 bg-opacity-40 p-6 rounded-lg">
            <img class="bg-cover productImage4 h-full w-full object-cover object-center mb-6" src="https://dummyimage.com/723x403" alt="content">
            <h3 class="productType4 tracking-widest text-purple-400 text-xs font-medium title-font">SUBTITLE</h3>
            <h2 class="productName4 text-lg text-gray-900 dark:text-white font-medium title-font mb-4">San Francisco</h2>
            <p class="productDescription4 leading-relaxed text-sm text-gray-600 dark:text-gray-400">Fingerstache flexitarian street art 8-bit waistcoat. Distillery hexagon disrupt edison bulbche.</p>
          </div>
        </div>
      </div>
    </div>
    `;

    const products = data.idClothes;
    let index = 1;
    products.forEach(async(productId) => {
      const productName = await getProductName(productId);
      const productImage = await getProductImage(productId);
      const productDescription = await getProductDescription(productId);
      const productType = await getProductType(productId);
      
      if(productImage !== '' && productName !== '' && productDescription !== '' && productType !== ''){ 
        styleBlock.querySelector(`.productImage${index}`).src = productImage;
        styleBlock.querySelector(`.productName${index}`).textContent = productName;
        styleBlock.querySelector(`.productType${index}`).textContent = productType;
        styleBlock.querySelector(`.productDescription${index}`).textContent = productDescription;
        styleBlock.querySelector(`.product${index}`).hidden = false; 
      }
      index += 1;
    });

    styleBlock.querySelector('.deleteStyleButton').addEventListener('click', function(){
      deleteStyle(data.id);
    })

    stylesBody.appendChild(styleBlock);

  } catch (error) {
    console.error(`Error showing product ${data.id}:`, error);
  }
}

async function renderStyles(styles) {
  const stylesBody = document.getElementById('stylesBody');
  stylesBody.innerHTML = '';
  styles.forEach((data) => {
    createStyleBlock(data, stylesBody);
  });
}

async function deleteStyle(styleId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите удалить стиль?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, удалить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const styleDoc = doc(stylesCollection, styleId);
          // Удаляем документ из коллекции "styles" в Firestore
          await deleteDoc(styleDoc);

          Swal.fire({
            icon: "success",
            title: "Удалено!",
            text: "Стиль был успешно удален.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const userId = await getUserId();
            const stylesItemsQuery = query(stylesCollection, where('idUser', '==', userId));
            const stylesSnapshot = await getDocs(stylesItemsQuery);
            const stylesData = await getStyles(stylesSnapshot);
            await renderStyles(stylesData);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при удалении стиля:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при удалении стиля.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error deleting style ${styleId}:`, error);
  }
}

// Получаем идентификатор пользователя из локального хранилища
async function getUserId() {
    try {
      const userId = localStorage.getItem('userId');
      if (userId === null) return 'ALL';
      else return userId;
    } catch (error) {
        return 'ALL';
    }
  }

//Получаем данные пользователя
async function getUserData(userId) {
  if (userId !== 'ALL') {
    const userDoc = doc(usersCollection, userId);

    // Получаем текущие данные пользователя
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      return userData;
    }
  }
  return null; // Возвращаем null, если userId равен 'ALL' или данные пользователя не найдены
}

async function getOrders(snapshot){
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const code = data.code;
    const products = data.products;
    const date = data.date;
    const orderType = data.orderType;
    const address = data.address;
    const price = data.price;
    const status = data.status;

    neededData.push({
      id,
      code,
      products,
      date,
      orderType,
      address,
      price,
      status
    });
  });

  return neededData;
}

async function createOrderProductBlock(list, product, size, color, quantity){
  try {
    const newItem = document.createElement('div');
    newItem.className = 'flex-shrink-0 m-6 relative overflow-hidden bg-gray-300 rounded-lg max-w-xs shadow-lg group';
    newItem.hidden = true;
  
    // Populate the table row with data from Firestore
    newItem.innerHTML = `
    <div class="relative pt-10 px-10 flex items-center justify-center group-hover:scale-110 transition-transform">
      <div class="block absolute w-48 h-48 bottom-0 left-0 -mb-24 ml-3"
          style="background: radial-gradient(black, transparent 60%); transform: rotate3d(0, 0, 1, 20deg) scale3d(1, 0.6, 1); opacity: 0.2;">
      </div>
      <img class="productImage relative w-40" alt="">
    </div>
    <div class="relative text-gray-800 px-6 pb-6 mt-6">
        <span class="block opacity-75 -mb-1">${product.name}</span>
        <div class="flex justify-between">
            <span class="block font-semibold text-l">${size}</span>
            <span class="block font-semibold text-l">${color}</span>
            <span class="block font-semibold text-l">${quantity} шт.</span>
            <span class="block bg-white rounded-full text-purple-600 text-xs font-bold px-3 py-2 leading-none flex items-center">${product.price} ₽</span>
        </div>
    </div>
    `;
    const imageElement = newItem.querySelector('.productImage'); 
    const imagePath = product.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    list.appendChild(newItem);
    newItem.hidden = false;

  } catch (error) {
    console.error(`Error showing product ${product.id}:`, error);
  }
}

async function getProductsFromClothesCollection(productsData) {
  const clothesCollection = collection(db, 'clothes');
  const clothesDocRefs = Object.keys(productsData).map(productId => doc(clothesCollection, productId));
  const clothesSnapshots = await Promise.all(clothesDocRefs.map(docRef => getDoc(docRef)));

  return clothesSnapshots;
}

async function showOrderModal(data){
  const hideModalButton = document.getElementById('hideModalButton');
  hideModalButton.addEventListener('click', function(){
    modal.hide()
  })


  const orderNumber = document.getElementById('orderNumber');
  const orderType = document.getElementById('orderType');
  const orderAddress = document.getElementById('orderAddress');
  const orderDate = document.getElementById('orderDate');

  orderNumber.textContent = data.code;
  orderType.textContent = data.orderType;
  orderAddress.textContent = data.address;
  orderDate.textContent = data.date;

  const products = data.products;
  const clothesSnapshots = await getProductsFromClothesCollection(products);

  const orderClothesList = document.getElementById('orderClothesList');
  orderClothesList.innerHTML = '';

  clothesSnapshots.forEach(async(clothesSnapshot, index) => {
    if (clothesSnapshot.exists()) {
      const product = clothesSnapshot.data();
      const { size, color, quantity } = products[Object.keys(products)[index]];

      await createOrderProductBlock(orderClothesList, product, size, color, quantity)

    } else {
      console.log(`Документ с идентификатором ${Object.keys(products)[index]} не найден в коллекции clothes`);
    }
  });

  modal.show();
}

async function cancelOrder(orderId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите отменить заказ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, отменить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const orderCollection = collection(db, 'orders');
          const orderDoc = doc(orderCollection, orderId);
          await updateDoc(orderDoc, { status: 'Отменен' });

          Swal.fire({
            icon: "success",
            title: "Отменен!",
            text: "Заказ был успешно отменен.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const userId = await getUserId();
            const userData = await getUserData(userId);  
            const userOrders = userData.idOrders;
            const ordersData = await getOrdersData(userOrders);
            const orders = await getOrders(ordersData);
            renderOrders(orders);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при отмене заказа:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при отмене заказа.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error cancel order ${orderId}:`, error);
  }
}

async function recoverOrder(orderId){
  try {
    Swal.fire({
      title: "Восстановить заказ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, восстановить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const orderCollection = collection(db, 'orders');
          const orderDoc = doc(orderCollection, orderId);
          await updateDoc(orderDoc, { status: 'В обработке' });

          Swal.fire({
            icon: "success",
            title: "Восстановлено!",
            text: "Заказ был успешно восстановлен.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const userId = await getUserId();
            const userData = await getUserData(userId);  
            const userOrders = userData.idOrders;
            const ordersData = await getOrdersData(userOrders);
            const orders = await getOrders(ordersData);
            renderOrders(orders);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при восстановлении заказа:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при восстановлении заказа.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error recovering order ${orderId}:`, error);
  }
}

//Создаем Таблицу
async function createOrdersRow(data, tableBody) {
  try {
    const newRow = document.createElement('div');
    newRow.className = 'flex flex-wrap items-center gap-y-4 py-6';
    newRow.hidden = true;

  
    // Populate the table row with data from Firestore
    newRow.innerHTML = `
    <dl class="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Номер заказа:</dt>
      <dd class="mt-1.5 text-base font-semibold text-purple-500">
        <button class="hover:underline">${data.code}</button>
      </dd>
    </dl>

    <dl class="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Дата:</dt>
      <dd class="mt-1.5 text-base font-semibold text-gray-800 dark:text-gray-200">${data.date}</dd>
    </dl>

    <dl class="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Стоимость:</dt>
      <dd class="mt-1.5 text-base font-semibold text-red-500">${data.price} ₽</dd>
    </dl>

    <dl class="status w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Статус:</dt>
      <dd class=" me-2 mt-1.5 inline-flex items-center rounded bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-300">
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 4h-13m13 16h-13M8 20v-3.333a2 2 0 0 1 .4-1.2L10 12.6a1 1 0 0 0 0-1.2L8.4 8.533a2 2 0 0 1-.4-1.2V4h8v3.333a2 2 0 0 1-.4 1.2L13.957 11.4a1 1 0 0 0 0 1.2l1.643 2.867a2 2 0 0 1 .4 1.2V20H8Z" />
        </svg>
        ${data.status}
      </dd>
    </dl>

    <div class="w-full grid sm:grid-cols-2 lg:flex lg:w-64 lg:items-center lg:justify-end gap-4">
      <button type="button" class="cancelButton w-full rounded-lg border border-red-700 px-3 py-2 text-center text-sm font-medium text-red-700 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900 lg:w-auto">Отменить</button>
      <button type="button" hidden class="orderButton w-full rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 lg:w-auto">Заказать</button>
      <button href="#" class="moreButton w-full inline-flex justify-center rounded-lg  border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 lg:w-auto">Подробнее</button>
    </div>
    `;

    const cancelButton = newRow.querySelector(`.cancelButton`);
    const orderButton = newRow.querySelector(`.orderButton`);

    let statusHtml = ``;
    if(data.status === 'В обработке'){
      statusHtml = `
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Статус:</dt>
      <dd class=" me-2 mt-1.5 inline-flex items-center rounded bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-300">
      <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 4h-13m13 16h-13M8 20v-3.333a2 2 0 0 1 .4-1.2L10 12.6a1 1 0 0 0 0-1.2L8.4 8.533a2 2 0 0 1-.4-1.2V4h8v3.333a2 2 0 0 1-.4 1.2L13.957 11.4a1 1 0 0 0 0 1.2l1.643 2.867a2 2 0 0 1 .4 1.2V20H8Z" />
      </svg>
      ${data.status}
    </dd>`
    }
    else if(data.status === 'Отменен'){
      cancelButton.hidden = true;
      orderButton.hidden = false;
      statusHtml = `
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Статус:</dt>
      <dd class="me-2 mt-1.5 inline-flex items-center rounded bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
      <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" />
      </svg>
      ${data.status}
    </dd>`
    }
    else if(data.status === 'Выполнен'){
      statusHtml = `
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Статус:</dt>
      <dd class="me-2 mt-1.5 inline-flex items-center rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5" />
        </svg>
        ${data.status}
      </dd>`
    }
    else if(data.status === 'В ожидании'){
      statusHtml = `
      <dt class="text-base font-medium text-gray-700 dark:text-gray-400">Статус:</dt>
      <dd class="me-2 mt-1.5 inline-flex items-center rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
        </svg>
        ${data.status}
      </dd>`
    }
    const statusCol = newRow.querySelector(`.status`);
    statusCol.innerHTML = statusHtml;

    newRow.querySelector(`.moreButton`).addEventListener('click', function(){
      showOrderModal(data);
      // show the modal
      modal.show();
    });

    cancelButton.addEventListener('click', () => {
      const orderId = data.id;
      cancelOrder(orderId);
    });

    orderButton.addEventListener('click', () => {
      const orderId = data.id;
      recoverOrder(orderId);
    });

    tableBody.appendChild(newRow);
    newRow.hidden = false;

  } catch (error) {
    console.error(`Error showing product ${data.id}:`, error);
  }
}

async function renderOrders(orders){
  const ordersTable = document.getElementById('ordersTable');
  const emptyTable = document.getElementById('emptyTable');
  ordersTable.hidden = false;
  emptyTable.hidden = true;

  const ordersTableBody = document.getElementById('ordersTableBody');
  ordersTableBody.innerHTML = '';

  orders.forEach((data) => {
    createOrdersRow(data, ordersTableBody);
  });
}

async function getOrdersData(idOrders){
  const orderCollection = collection(db, 'orders');

  const promises = idOrders.map(async (orderId) => {
    const docRef = doc(orderCollection, orderId);
    const docSnap = await getDoc(docRef);
    return docSnap;
  });

  const snapshots = await Promise.all(promises);

  return snapshots;
}

async function showUserData(userData){
  email.value = userData.email;
  password.value = userData.password;
  surname.value = userData.surname;
  name.value = userData.name;
  phone.value = userData.phone;
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


async function renderCartModal(userId){
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

async function getCartItemsCount(userId){
  const cartQuery = query(cartCollection, where('idUser', '==', userId));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}

const cartItemsCountText = document.getElementById('cartItemsCountText');
const favouritesItemsCountText = document.getElementById('favouritesItemsCountText');
const wardrobeItemsCountText = document.getElementById('wardrobeItemsCountText');

const _userId = await getUserId();
const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function(){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите выйти из профиля?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, выйти!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          localStorage.setItem('userId', 'ALL');

          Swal.fire({
            icon: "success",
            title: "Успешно!",
            text: "Вы вышли из системы.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            window.location.href = 'auth.html';
          }, 2000);
        } catch (error) {
          console.error("Ошибка:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка выходе из системы.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error cancel order ${orderId}:`, error);
  }
});

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

const exitHeaderButton = document.getElementById('exitHeaderButton');
exitHeaderButton.addEventListener('click', exitUser);

async function main(){
  const userId = await getUserId();
  const userData = await getUserData(userId);  
  if (userData) {
    showUserData(userData);
    const userOrders = userData.idOrders;
    const ordersData = await getOrdersData(userOrders);
    const orders = await getOrders(ordersData);
    renderOrders(orders);
  }

  const stylesItemsQuery = query(stylesCollection, where('idUser', '==', userId));
  const stylesSnapshot = await getDocs(stylesItemsQuery);
  const stylesData = await getStyles(stylesSnapshot);
  renderStyles(stylesData);

  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");

  await getCartItemsCount(userId).then(count => {
    console.log(`Количество документов с idUser ${userId}: ${count}`);
    const countElement = document.getElementById('cartCounter');
    countElement.textContent = count;
    if(count > 0) {
      renderCartModal(userId);
      handleNotEmptyCart()
    }
    else{
      handleEmptyCart();
    }
    cartItemsCountText.textContent = `${count} товар.`;
    const userFavourites = userData.idFavourites;
    favouritesItemsCountText.textContent = `${userFavourites.length} товар.`;
    const userWardrobe = userData.idWardrobeClothes;
    wardrobeItemsCountText.textContent = `${userWardrobe.length} товар.`;
  })
}

main()
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

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

let _userId = 'ALL';

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const clothesCollection = collection(db, 'clothes');
const usersCollection = collection(db, 'users');


const surnameText = document.getElementById('surname');
const nameText = document.getElementById('name');
const emailText = document.getElementById('email');
const phoneText = document.getElementById('phone');
const orderTypeSelect = document.getElementById('orderTypeSelect');
const addressInput = document.getElementById('addressInput');
const pickUpPointSelect = document.getElementById('pickUpPointSelect');
const orderDatePicker = document.getElementById('orderDatePicker');

// Получите идентификатор пользователя из локального хранилища
async function getUserId() {
  try {
    const userId = localStorage.getItem('userId');
    if (userId === null) return 'ALL';
    else return userId;
  } catch (error) {
      return 'ALL';
  }
}

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

async function populateList(data, size, color, quantity) {
  const purchaseItemsList = document.getElementById('purchaseItemsList');
  const purchaseItemsItem = document.createElement('div');
  purchaseItemsItem.className = 'flex justify-between mt-6';

  purchaseItemsItem.innerHTML = `
    <div class="flex">
        <img class="productImage h-20 w-20 object-cover rounded" src="images/loading.gif" alt="">
        <div class="mx-3">
            <h3 class="text-xl text-purple-500 font-medium">${data.name}</h3>
            <div class="flex items-center mt-2">
                <h2 class="text-l text-gray-800 dark:text-gray-200 font-medium">${size}</h2>
                <h2 class="ml-4 text-l text-gray-800 dark:text-gray-200 font-medium">${color}</h2>
                <h2 class="ml-4 text-l text-gray-800 dark:text-gray-200 font-medium">${quantity} шт.</h2>
            </div>
        </div>
    </div>
    <span class="price text-gray-800 dark:text-gray-200"></span>
  `;

  const imageElement = purchaseItemsItem.querySelector('.productImage');
  const imagePath = data.image;
  const storageImageRef = ref(storage, `images/${imagePath}.png`);
  const imageUrl = await getDownloadURL(storageImageRef);
  imageElement.src = imageUrl;

  const price = data.price;
  const discountProduct = data.discount;
  let finalPrice = data.price;
  if(discountProduct != 0){
    finalPrice = Math.round(price * (100 - discountProduct) / 100)
    purchaseItemsItem.querySelector('.price').textContent = `₽ ${finalPrice * parseInt(quantity)}`;
  }else{
    purchaseItemsItem.querySelector('.price').textContent = `₽ ${finalPrice * parseInt(quantity)}`;
  }

  purchaseItemsList.appendChild(purchaseItemsItem);
}

async function getPriceData(purchaseData) {
  const productsData = purchaseData.price;
  return productsData;
}

async function getProductsData(purchaseData) {
  const productsData = purchaseData.products;
  return productsData;
}

async function getProductsFromClothesCollection(productsData) {
  const clothesCollection = collection(db, 'clothes');
  const clothesDocRefs = Object.keys(productsData).map(productId => doc(clothesCollection, productId));
  const clothesSnapshots = await Promise.all(clothesDocRefs.map(docRef => getDoc(docRef)));

  return clothesSnapshots;
}

async function getPurchaseData(user) {
  const purchaseCollection = collection(db, 'purchase');
  const userPurchaseItemsQuery = doc(purchaseCollection, user.purchaseId);

  const purchaseSnapshot = await getDoc(userPurchaseItemsQuery);
  if (purchaseSnapshot.exists()) {
    return purchaseSnapshot.data();
  } else {
    console.log('Документ purchase не найден!');
    return null;
  }
}

async function renderItemsList(user) {
  const purchaseData = await getPurchaseData(user);
  if (purchaseData) {
    const productsData = await getProductsData(purchaseData);
    const clothesSnapshots = await getProductsFromClothesCollection(productsData);

    clothesSnapshots.forEach((clothesSnapshot, index) => {
      if (clothesSnapshot.exists()) {
        const product = clothesSnapshot.data();
        const { size, color, quantity } = productsData[Object.keys(productsData)[index]];
        populateList(product, size, color, quantity);
      } else {
        console.log(`Документ с идентификатором ${Object.keys(productsData)[index]} не найден в коллекции clothes`);
      }
    });

    const itemsCountText = document.getElementById('itemsCountText');
    itemsCountText.textContent = `Всего товаров: ${Object.keys(productsData).length}`;

    const totalSum = document.getElementById('totalSum');
    totalSum.textContent = `₽ ${purchaseData.price}`;
  }
}


// Добавляем обработчик события change на селект orderTypeSelect
orderTypeSelect.addEventListener('change', function() {
  // Получаем выбранное значение
  const selectedValue = this.value;

  // Проверяем выбранное значение и изменяем состояние элементов
  if (selectedValue === 'Доставка') {
    addressInput.disabled = false;
    addressInput.required = true;
    pickUpPointSelect.disabled = true;
    pickUpPointSelect.required = false;
  } else if (selectedValue === 'Пункт выдачи') {
    addressInput.disabled = true;
    addressInput.required = false;
    pickUpPointSelect.disabled = false;
    pickUpPointSelect.required = true;
  }
});

function generateCode() {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  const random = arr[0] % (charset.length + 1);
  return `${charset.charAt(random)}-${Array(8).fill(0).map(() => charset.charAt(Math.floor(Math.random() * charset.length))).join("")}`;
}

async function confirmOrder(){
  try{
    const surname = surnameText.value;
    const name = nameText.value;
    const email = emailText.value;
    const phone = phoneText.value;
    const date = orderDatePicker.value;
    let address = '';
  
    const orderTypeValue = orderTypeSelect.value;
    if (orderTypeValue === 'Доставка') {address = addressInput.value;} 
    else if (orderTypeValue === 'Пункт выдачи') {address = pickUpPointSelect.value;}
  
    const userData = await getUserData(_userId);  
    const purchaseData = await getPurchaseData(userData);
    const products = await getProductsData(purchaseData);
    const price = await getPriceData(purchaseData);
      
    const code = generateCode();
  
    const newOrder = {
      surname: surname,
      name: name,
      email: email,
      phone: phone,
      products: products,
      price: price,
      orderType: orderTypeValue,
      address: address,
      date: date,
      code: code,
      status: 'В обработке'
    };
    const purchaseCollection = collection(db, 'purchase');
    const shoppingCartRef = collection(db, 'shoppingCart');
    const userCartItemsQuery = query(shoppingCartRef, where('idUser', '==', _userId));
    const cartQuerySnapshot = await getDocs(userCartItemsQuery);
    
    const ordersCollection = collection(db, 'orders');
    const newUserOrder = await addDoc(ordersCollection, newOrder);
    const newOrderId = newUserOrder.id;

    const userDoc = doc(usersCollection, _userId);

    // Получаем текущие данные пользователя
    getDoc(userDoc).then((userDocSnapshot) => {
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const userOrderIds = userData.idOrders || [];
  
        userOrderIds.push(newOrderId);

        const userPurchaseId = userData.purchaseId;
        if(userPurchaseId !== ''){const purchaseDoc = doc(purchaseCollection, userPurchaseId); deleteDoc(purchaseDoc);}

        // Обновляем данные пользователя в базе данных
        updateDoc(userDoc, { idOrders: userOrderIds, purchaseId: '' }).then(() => {

        // Удаляем товары из корзины
        cartQuerySnapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });

        Swal.fire({
          icon: "success",
          title: "Заказ оформлен!",
          showConfirmButton: false,
          timer: 1500
        });
        setTimeout(function() {
          window.location.href = 'user_profile.html';
        }, 2000);

        }).catch((error) => {
          console.error('Error updating user data:', error);
        });
      }
    }).catch((error) => {
      console.error('Error fetching user data:', error);
    });
  }
  catch (error) {
    console.error("Error adding order:", error);
  }
}

const orderConfirmButton = document.getElementById('orderConfirmButton');
orderConfirmButton.addEventListener('click', function(event) {
  event.preventDefault();
  confirmOrder();
});


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
                <a href="#">${productData.name}</a>
              </h3>
              <p class="ml-4 text-sm text-red-500">₽${productData.price}</p>
            </div>
          </div>
          <div class="flex flex-1 items-end justify-between text-l">
            <p class="text-red-500">-${productData.discount}%</p>

            <div class="flex">
              <button type="button" class="deleteFromCartButton font-medium text-purple-300 hover:text-purple-200">Удалить</button>
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
        //deleteFromCart(itemId);
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

async function showUserData(userData){
  emailText.value = userData.email;
  surnameText.value = userData.surname;
  nameText.value = userData.name;
  phoneText.value = userData.phone;
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

async function main(){
  const userId = await getUserId();
  _userId = userId;
  const userData = await getUserData(userId);  
  if (userData) {
    await showUserData(userData);
  }
  await renderItemsList(userData);


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

document.addEventListener('DOMContentLoaded', function() {
  main();
});
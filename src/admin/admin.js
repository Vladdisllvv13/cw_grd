import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, query, where, limit, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import './admin.css';

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
const clothesCollection = collection(db, 'clothes');
const stylesCollection = collection(db, 'styles');
const stylesItemsQuery = query(stylesCollection, where('idUser', '==', 'ALL'));
const stylesSnapshot = await getDocs(stylesItemsQuery);

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
const _userId = await getUserId();


async function checkId(){
  const userId = await getUserId()
  if(userId !== '1'){
      window.location = 'index.html';
  }
}
checkId()

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

async function getClothes(snapshot){
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const name = data.name;
    const price = data.price;
    const image = data.image;
    const ordered = data.ordered;

    neededData.push({
      id,
      name,
      price,
      image,
      ordered,
    });
  });

  // Сортировка массива по убыванию значения uses
  neededData.sort((a, b) => b.ordered - a.ordered);

  // Возвращаем первые 10 элементов
  return neededData.slice(0, 5);
}

async function getStyles(snapshot){
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const name = data.name;
    const price = data.price;
    const idUser = data.idUser;
    const image = data.image;
    const uses = data.uses;

    neededData.push({
      id,
      name,
      price,
      idUser,
      image,
      uses,
    });
  });

  // Сортировка массива по убыванию значения uses
  neededData.sort((a, b) => b.uses - a.uses);

  // Возвращаем первые 10 элементов
  return neededData.slice(0, 5);
}

//Создаем Таблицу
async function createClothesRow(data, tableBody) {
  try {
    const newRow = document.createElement('li');
    newRow.className = 'py-3 sm:py-4';
    newRow.hidden = true;

    // Populate the table row with data from Firestore
    newRow.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center min-w-0">
            <img class="img flex-shrink-0 w-10 h-10">
            <div class="ml-3">
              <p class="font-medium text-gray-900 truncate dark:text-white">
                ${data.name}
              </p>
            </div>
          </div>
          <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
            ${data.ordered}
          </div>
        </div>
    `;

    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    newRow.querySelector('img').src = imageUrl;

    // Append the new row to the table body
    tableBody.appendChild(newRow);
    newRow.hidden = false;

  } catch (error) {
    console.error(`Error showing product ${data.id}:`, error);
  }
}

//Создаем Таблицу
async function createStylesRow(data, tableBody) {
  try {
    const newRow = document.createElement('li');
    newRow.className = 'py-3 sm:py-4';
    newRow.hidden = true;

    // Populate the table row with data from Firestore
    newRow.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <img class="img w-8 h-8 rounded-full">
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate dark:text-white">
              ${data.name}
            </p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">
              ${data.price} ₽
            </p>
          </div>
          <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
            ${data.uses}
          </div>
        </div>
    `;

    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}`);
    const imageUrl = await getDownloadURL(storageImageRef);
    newRow.querySelector('img').src = imageUrl;

    // Append the new row to the table body
    tableBody.appendChild(newRow);
    newRow.hidden = false;

  } catch (error) {
    console.error(`Error showing style ${data.id}:`, error);
  }
}


//Рендерим все найденное
async function renderClothes(clothes) {
  const clothesList = document.getElementById("clothesList");
  clothesList.innerHTML = '';
  clothes.forEach((data) => {
    createClothesRow(data, clothesList);
  });
}

//Рендерим все найденное
async function renderStyles(styles) {
  const stylesList = document.getElementById("stylesList");
  stylesList.innerHTML = '';
  styles.forEach((data) => {
    createStylesRow(data, stylesList);
  });
}


async function showClothesTop(){
  const clothesSnapshot = await getDocs(clothesCollection);
  const clothesData = await getClothes(clothesSnapshot);
  await renderClothes(clothesData);
}


async function showStylesTop(){
  const stylesData = await getStyles(stylesSnapshot);
  await renderStyles(stylesData);
}

async function main(){

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

  showClothesTop();
  showStylesTop();
}

main()
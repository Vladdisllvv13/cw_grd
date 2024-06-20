import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, where, query, deleteDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { Modal } from 'flowbite'


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

let totalSum = 0;
let finalSum = 0;
let itemsCount = 0;
let discount = 0;

let _userId = null;

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
const cartCollection = collection(db, 'shoppingCart');
const usersCollection = collection(db, 'users');


const userId = await getUserId()
  
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
        /* Read more about handling dismissals below */
        if (result.dismiss === Swal.DismissReason.timer) {
          console.log("I was closed by the timer");
        }
      }); 
}

const emptyCartSection = document.getElementById('emptyCartSection');
const tableSection = document.getElementById('tableSection');

// Показ пустой корзины 
async function showEmptyCartSection(){
  tableSection.hidden = true;
  emptyCartSection.hidden = false;
}

//Получение данных корзины с последующим показом
async function getCart(){
  totalSum = 0;
  itemsCount = 0;
  const cartList = document.querySelector('#cartList');
  cartList.innerHTML = '';

  // Запрос данных из коллекции shoppingCart
  const shoppingCartRef = collection(db, 'shoppingCart');
  // Запрос данных из коллекции shoppingCart для конкретного пользователя
  const userCartItemsQuery = query(shoppingCartRef, where('idUser', '==', userId));
  const querySnapshots = await getDocs(userCartItemsQuery);
  if(querySnapshots.empty){
    showEmptyCartSection();
    return;
  } 
  tableSection.hidden = false;
  // Получение данных из запроса
  getDocs(userCartItemsQuery).then((querySnapshot) => {
    querySnapshot.forEach(async(doc) => {
      // Доступ к данным каждого документа и вывод информации о каждом элементе одежды
      const data = doc.data();
      itemsCount += 1;
      await populateList(data, doc.id)
    });
  });
}

//Создание элемента товара корзины
async function populateList(data, itemId) {

    const clothesRef = collection(db, 'clothes');
    const userClothesItemsQuery = doc(clothesRef, data.idCloth);

    // Получение данных из запроса
    getDoc(userClothesItemsQuery).then((doc) => {
        if (doc.exists()) {
        // Доступ к данным документа и вывод информации о каждом элементе одежды
        const clothData = doc.data();
        
        
        const cartBody = document.querySelector('#cartList');
  
        // Create a new table row
        const cartItem = document.createElement('div');
        cartItem.className = 'border-b border-gray-600 w-full ml-24 mr-24';
      
        // Populate the table row with data from Firestore
        cartItem.innerHTML = `
        <div class="py-5 sm:py-8 w-full ml-4 mr-4">
          <div class="flex flex-wrap gap-4 sm:py-2.5 lg:gap-6">
            <div class="sm:-my-2.5">
              <a href="#" class="group relative block h-40 w-40 overflow-hidden rounded-lg sm:h-40 sm:w-46">
                <img alt="cloth Image" class="clothImage h-full w-full object-cover object-center transition duration-200 group-hover:scale-105" />
              </a>
            </div>
  
            <div class="flex flex-1 flex-col justify-between">
              <div>
                <a class="mb-1 inline-block text-2xl font-bold text-purple-500 transition duration-100 hover:text-gray-500 lg:text-3xl">${clothData.name}</a>
                <span class="block text-gray-700 dark:text-gray-400 text-xl">Размер: ${data.idSize}</span>
                <span class="block text-gray-700 dark:text-gray-400 text-xl">Цвет: ${data.idColor}</span>
              </div>
              <div>
                <span class="priceElement mb-1 block text-2xl font-bold text-red-500 md:text-3xl line-through" hidden></span>
              </div>
            </div>
  
            <div class="flex w-full justify-between border-t pt-4 sm:w-auto sm:border-none sm:pt-0">
              <div class="flex flex-col items-start gap-2">
                <span class="block text-gray-600 dark:text-gray-300 text-xl">${data.quantity} шт.</span>
                <button id="deleteFromCartButton" class="select-none text-xl font-semibold text-indigo-500 transition duration-100 hover:text-indigo-600 active:text-indigo-700">Удалить</button>
              </div>
  
              <div class="ml-4 pt-3 sm:pt-2 md:ml-8 lg:ml-16">
                <span class="discountPriceElement block font-bold mr-4 text-3xl text-purple-500 md:text-4xl"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
        `;
        const clothImage = cartItem.querySelector('.clothImage');
        const image = clothData.image;
        const storageImageRef = ref(storage, `images/${image}.png`);
        const imageUrlPromise = getDownloadURL(storageImageRef);
        imageUrlPromise.then((imageUrl) => {
        clothImage.src = imageUrl;
        }).catch((error) => {
        console.log('Error retrieving image URL:', error);
        });
        
        const discountPriceElement = cartItem.querySelector('.discountPriceElement');
        const priceElement = cartItem.querySelector('.priceElement');
        const price = clothData.price;
        const discountProduct = clothData.discount;

        let finalPrice = clothData.price;
        if(discountProduct != 0){
          priceElement.hidden = false;
    
          priceElement.textContent = `₽ ${price}`;
          finalPrice = Math.round(price * (100 - discountProduct) / 100)
          discountPriceElement.textContent = `₽ ${finalPrice * parseInt(data.quantity)}`;
        }else{
          discountPriceElement.textContent = `₽ ${finalPrice * parseInt(data.quantity)}`;
        }
      
        // Append the new row to the table body
        cartBody.appendChild(cartItem);


        totalSum += finalPrice * parseInt(data.quantity);
        
        const totalSumText = document.getElementById('totalSum');
        const finalSumText = document.getElementById('finalSum');
        const discountText = document.getElementById('discount');
        totalSumText.textContent = `₽ ${totalSum}`;
        finalSum = Math.round(totalSum * (100 - discount) / 100);
        finalSumText.textContent = `₽ ${finalSum}`;
        discountText.textContent = `${discount}%`;



        const deleteFromCartButton = cartItem.querySelector('#deleteFromCartButton');
        deleteFromCartButton.addEventListener('click', () => {
          deleteFromCart(itemId);
        });

        } else {
        console.log('Документ не найден!');
        }
    }).catch((error) => {
        console.log('Ошибка:', error);
    });
}

//Удаление товара из корзины
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
        totalSum = 0;
        itemsCount = 0;
        const totalSumText = document.getElementById('totalSum');
        totalSumText.textContent = `₽ ${totalSum}`;
        getCart();
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

      } catch (error) {
        console.log('Ошибка при удалении документа:', error);
        showAlert("Не удалось удалить товар из корзины!");
      }
    }
  });
}

//Функция использования промокода
async function usePromo(value) {
  try {
    totalSum = 0;
    finalSum = 0;
    itemsCount = 0;
    const promoCollection = collection(db, 'promos');
    const promoQuery = query(promoCollection, where('name', '==', value));
    const querySnapshot = await getDocs(promoQuery);

    console.log(discount)

    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (document) => {
        const data = document.data();
        const promoId = document.id;

        const userCollection = collection(db, 'users');
        const userDoc = doc(userCollection, userId);
        // Retrieve the user document
        const userDocSnapshot = await getDoc(userDoc);
        const userData = userDocSnapshot.data();
        const usedPromoIds = userData.idUsedPromo || [];
        if (!usedPromoIds.includes(promoId)) {
          discount = data.discount;
        }
        else{
          showAlert("Скидочный код уже был использован!")
        }

        getCart();
    });
    
    } else {
      showAlert("Промокод не найден!")
    }
  } catch (error) {
    console.error('Ошибка при получении промокода:', error);
  }
}

// Обработчик нажатия кнопки Использовать промокод 
const usePromoButton = document.getElementById('usePromoButton');
const promoName = document.getElementById('promoName');
usePromoButton.addEventListener('click', async(event) =>{
  event.preventDefault();
  await usePromo(promoName.value);
});

// Запись данных товара в заказ
async function writeItemToPurchase(data) {
  try {
    const { idColor: color, idSize: size, idCloth: idCloth, quantity: quantity } = data;
    return { [idCloth]: { size, color, quantity } };
  } catch (error) {
    showAlert("Не удалось добавить товар в заказ!");
  }
}

// Добавление нового объекта добавления заказа
async function checkoutPurchase() {
  try {
    const userId = await getUserId();
    const shoppingCartRef = collection(db, 'shoppingCart');
    const userCartItemsQuery = query(shoppingCartRef, where('idUser', '==', userId));

    const querySnapshot = await getDocs(userCartItemsQuery);
    const products = (
      await Promise.all(
        querySnapshot.docs.map(async (doc) => writeItemToPurchase(doc.data()))
      )
    ).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const newPurchase = {
      idUser: userId,
      products,
      discount: discount,
      price: finalSum,
    };
    const purchaseCollection = collection(db, 'purchase');
    const newPurchaseRef = await addDoc(purchaseCollection, newPurchase);
    const newPurchaseId = newPurchaseRef.id;
  
    
    const userDoc = doc(usersCollection, _userId);

    // Получаем текущие данные пользователя
    getDoc(userDoc).then((userDocSnapshot) => {
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        
        const userPurchaseId = userData.purchaseId;
        if(userPurchaseId !== ''){const purchaseDoc = doc(purchaseCollection, userPurchaseId); deleteDoc(purchaseDoc);}
        updateDoc(userDoc, { purchaseId: newPurchaseId })
      }
    }).catch((error) => {
      console.error('Error fetching user data:', error);
    });

    Swal.fire({
      icon: "success",
      title: "Готово!",
      showConfirmButton: false,
      timer: 1500
    });
    setTimeout(function() {
      window.location.href = 'purchase.html';
    }, 2000);

  } catch (error) {
    console.log('Ошибка при обработке заказа:', error);
    showAlert("Невозможно создать заказ!");
  }
}


// Обработчик для кнопки В каталог
const toCatalogButton = document.getElementById('toCatalogButton');
toCatalogButton.addEventListener('click', function() {
    window.location = 'catalog.html';
});

// Обработчик для кнопки Заказать
const checkoutButton = document.getElementById('checkoutButton');
checkoutButton.addEventListener('click', function() {
    if(itemsCount != 0) checkoutPurchase()
});


// Получаем количество элементов из корзины
async function getCartItemsCount(idUser){
  const cartQuery = query(cartCollection, where('idUser', '==', idUser));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}


const notEmptyCartBlock = document.getElementById('notEmptyCartBlock');
const emptyCartBlock = document.getElementById('emptyCartBlock');
const cartModalList = document.getElementById('cartModalList');

// Если Корзина пустая
function handleEmptyCart() {
  notEmptyCartBlock.hidden = true;
  emptyCartBlock.hidden = false;
}

// Если Корзина непустая
function handleNotEmptyCart() {
  notEmptyCartBlock.hidden = false;
  emptyCartBlock.hidden = true;
}

// Удаление товара из корзины 
async function deleteFromCartModal(itemId){
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

// Создаем товары корзины 
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
        deleteFromCartModal(itemId);
      });

      cartModalList.appendChild(cartModalBlock);

    } else {
    console.log('Документ не найден!');
    }
  }).catch((error) => {
      console.log('Ошибка:', error);
  });
}

// Рендер корзины в меню
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

// Переход на страницу профиля
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

//Главная функция
async function main(){
  const userId = await getUserId();
  if(userId === 'ALL'){ window.location.href = 'index.html'; }
  _userId = userId;
  await getCart();
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
  
main()
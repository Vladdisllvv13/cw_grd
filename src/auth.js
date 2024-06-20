import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const cartCollection = collection(db, 'shoppingCart');
const clothesCollection = collection(db, 'clothes');

const registerButton = document.getElementById('authUserButton');
registerButton.addEventListener('click', authUser);

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

//Функция для выполнения входа в систему
async function authUser() {
  // Берем значения из полей
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('email', '==', email), where('password', '==', password));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Пользователь не найден
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Неправильный электронный адрес или пароль!",
    });
  } else {
    
    // Получаем идентификатор пользователя из первого документа в результате запроса
    const userId = querySnapshot.docs[0].id;
    const userData = querySnapshot.docs[0].data();

    // Сохраняем идентификатор пользователя в локальном хранилище
    localStorage.setItem('userId', userId);

    let timerInterval;
    Swal.fire({
      title: "Вход выполнен!",
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
    }).then(() => {
      switch(userData.idRole){
        case '1':
          window.location.href = "admin.html";
          break;
        case '2':
          window.location.href = "index.html";
          break;
        default:
          alert( "Не удалось распознать роль пользователя" );
      }
    });  
  }
}

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

// Показываем уведомление
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

// Удаление товара из корзины в меню
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

// Переход а страницу профиля
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

let _userId;

//Главная функция
async function main(){
  const userId = await getUserId();
  _userId = userId;

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
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");
}

main();
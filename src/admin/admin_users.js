import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { Modal } from 'flowbite'

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
const _userId = await getUserId();

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const usersCollection = collection(db, 'users');
const clothesCollection = collection(db, 'clothes');


const $modalElement = document.getElementById('crud-modal');
const modal = new Modal($modalElement);

//Создаем Таблицу
async function createUsersRow(data, tableBody) {
  try {
    const newRow = document.createElement('tr');
    newRow.className = 'h-24 border-gray-400 dark:border-gray-300 border-b dark:text-gray-300 text-gray-700';
    newRow.hidden = true;

    const surname = (data.surname) ? data.surname : '';
    const name = (data.name) ? data.name : '';
    const email = (data.email) ? data.email : '';
    const phone = (data.phone) ? data.phone : '';
    const gender = (data.gender) ? data.gender : '';
  
    // Populate the table row with data from Firestore
    newRow.innerHTML = `
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap text-purple-500 tracking-normal leading-4">${data.id}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap text-indigo-500 tracking-normal leading-4">${surname}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${name}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${email}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${phone}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap text-purple-500 tracking-normal leading-4">${gender}</td>

    <td class="pr-8 relative">
      <button aria-label="dropdown" role="button" class="dropbtn text-gray-500 rounded cursor-pointer border border-transparent  focus:outline-none focus:ring-2 focus:ring-offset-2  focus:ring-gray-400">
          <img src="https://tuk-cdn.s3.amazonaws.com/can-uploader/compact_table_with_actions_and_select-svg9.svg" alt="dropdown">
      </button>
      <div class="dropdown-content mt-1 absolute left-0 -ml-12 shadow-md z-10 hidden w-32">
          <ul class="bg-white dark:bg-gray-800 shadow rounded py-1">
              <button id="updateButton" role="button" aria-label="add table" class="text-left w-full text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-purple-500 hover:text-purple-400 px-3 font-normal">Изменить</button>
              <button id="deleteButton" class="text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-red-500 hover:text-red-400 px-3 font-normal">Удалить</button>
          </ul>
      </div>
    </td>
    `;


    // Append the new row to the table body
    tableBody.appendChild(newRow);
    newRow.hidden = false;

    const updateButton = newRow.querySelector('#updateButton');
    updateButton.addEventListener('click', async() => {
      await updateUser(data);
    });


    const deleteButton = newRow.querySelector('#deleteButton');
    deleteButton.addEventListener('click', () => {
      const userId = data.id;
      deleteUser(userId);
    });


    // Get the button element
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

async function renderUsers(users){
  const usersTable = document.getElementById('usersTable');
  //const emptyTable = document.getElementById('emptyTable');
  usersTable.hidden = false;
  //emptyTable.hidden = true;

  usersTable.innerHTML = '';

  users.forEach((data) => {
    createUsersRow(data, usersTable);
  });
}

async function getUsers(snapshot){
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const surname = data.surname;
    const name = data.name;
    const email = data.email;
    const phone = data.phone;
    const gender = data.gender;

    neededData.push({
      id,
      surname,
      name,
      email,
      phone,
      gender
    });
  });

  return neededData;
}

async function deleteUser(userId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите удалить пользователя?",
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
          const userDoc = doc(usersCollection, userId);
          // Удаляем документ из коллекции "users" в Firestore
          await deleteDoc(userDoc);
          Swal.fire({
            icon: "success",
            title: "Удалено!",
            text: "Пользователь был успешно удален.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const usersSnapshot = await getDocs(usersCollection);
            const users = await getUsers(usersSnapshot);
            renderUsers(users);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при удалении пользователя:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при удалении пользователя.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
  }
}

async function updateUser(data){
  try {

    const userSurname = document.getElementById('surname');
    const userName = document.getElementById('name');
    const userEmail = document.getElementById('email');
    const userPhone = document.getElementById('phone');
    const userGenderSelect = document.getElementById('userGenderSelect');
    const userPassword = document.getElementById('password');

    userSurname.value = '';
    userName.value = '';
    userEmail.value = '';
    userPhone.value = '';
    userGenderSelect.value = 'Мужской';
    userPassword.value = '';

    if(data !== null) {
      userSurname.value = data.surname;
      userName.value = data.name;
      userEmail.value = (data.email) ? data.email : '';
      userPhone.value = (data.phone) ? data.phone : '';;
      userGenderSelect.value = data.gender;
    }

    modal.show();

    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', async(event) => {
      event.preventDefault();

      const newUser = {
        surname: userSurname.value,
        name: userName.value,
        email: userEmail.value,
        phone: userPhone.value,
        gender: userGenderSelect.value,
      };
      
      console.log(newUser)
      if(data === null){
        try {
          const user = await addDoc(usersCollection, newUser)
          const docRef = doc(db, 'users', user.id);
          const password = userPassword.value;
          updateDoc(docRef, { password: password, purchaseId: '', idFavourites: [], idFavouriteStyles: [], idWardrobeClothes: [], idOrders: []});

          Swal.fire({
            icon: "success",
            title: "Добавлено!",
            text: "Пользователь был успешно добавлен.",
            showConfirmButton: true,
          });
          setTimeout(async function() {
            const usersSnapshot = await getDocs(usersCollection);
            const users = await getUsers(usersSnapshot);
            renderUsers(users);
            modal.hide();
          }, 2000);
        }
        catch (error) {
          console.error(`Error adding new user:`, error);
        }
      }
      else if (data !== null){
        // Update the document in the "clothes" collection with the selected color and size IDs
        const docRef = doc(db, 'users', data.id);
        updateDoc(docRef, newUser);
        Swal.fire({
          icon: "success",
          title: "Изменено!",
          text: "Данные пользователя были успешно изменены.",
          showConfirmButton: true,
        });
        setTimeout(async function() {
          const usersSnapshot = await getDocs(usersCollection);
          const users = await getUsers(usersSnapshot);
          renderUsers(users);
          modal.hide();
        }, 2000);
      }
      data = null;
    });


  } catch (error) {
    console.error(`Error updating user:`, error);
  }
}

async function searchUsers(text){

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
    collection(db, "users"),
    where("surname", ">=", start),
    where("surname", "<=", end)
  );

  const querySnapshot = await getDocs(q);
  const users = await getUsers(querySnapshot);
  renderUsers(users);
}

const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
// Добавляем обработчик события на поле ввода
searchInput.addEventListener('keydown', function(event) {
  // Проверяем, нажата ли клавиша Enter
  if (event.key === 'Enter') {
    // Вызываем функцию search()
    searchUsers(searchInput.value);
  }
});
searchButton.addEventListener('click', (event) => {
  event.preventDefault();
  searchUsers(searchInput.value);
})


const addUserButton = document.getElementById('addUserButton');
addUserButton.addEventListener('click', async function(event) {
  event.preventDefault();
  await updateUser(null);
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

async function main(){
  const usersSnapshot = await getDocs(usersCollection);
  const users = await getUsers(usersSnapshot);
  renderUsers(users);

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
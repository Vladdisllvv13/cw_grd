import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, where, query, deleteDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";



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
let itemsCount = 0;


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

const userId = await getUserId()
  

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

async function showEmptyCartSection(){
  

  tableSection.hidden = true;
  emptyCartSection.hidden = false;
}

async function getCart(){
  const tableBody = document.querySelector('#clothTable tbody');
  tableBody.innerHTML = '';

  // Запрос данных из коллекции shoppingCart для конкретного пользователя
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
    querySnapshot.forEach((doc) => {
      // Доступ к данным каждого документа и вывод информации о каждом элементе одежды
      const data = doc.data();
      itemsCount += 1;
      populateTable(data, doc.id)
    });
  });
}




async function populateTable(data, itemId) {

    const clothesRef = collection(db, 'clothes');
    const userClothesItemsQuery = doc(clothesRef, data.idCloth);

    // Получение данных из запроса
    getDoc(userClothesItemsQuery).then((doc) => {
        if (doc.exists()) {
        // Доступ к данным документа и вывод информации о каждом элементе одежды
        const clothData = doc.data();
        
        
        const tableBody = document.querySelector('#clothTable tbody');
  
        // Create a new table row
        const newRow = document.createElement('tr');
        newRow.className = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600';
      
        // Populate the table row with data from Firestore
        newRow.innerHTML = `
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
          <img alt="Cloth Image" class="clothImage object-scale-down h-20 rounded w-20 object-center">
          </th>
          <th scope="row" class="text-xl font-bold px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
            ${clothData.name}
          </th>
          <td class="px-6 py-4">
            ${data.idSize}
          </td>
          <td class="px-6 py-4">
            ${data.idColor}
          </td>
          <td class="px-6 py-4 text-purple-600 text-base font-medium">
            ${clothData.price} руб.
          </td>
          <td class="px-6 py-4 text-right">
            <button id="delteFromCartButton" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Удалить из корзины</button>
          </td>
        `;
        const clothImage = newRow.querySelector('.clothImage');
        const image = clothData.image;
        const storageImageRef = ref(storage, `images/${image}.jpg`);
        const imageUrlPromise = getDownloadURL(storageImageRef);
        imageUrlPromise.then((imageUrl) => {
        clothImage.src = imageUrl;
        }).catch((error) => {
        console.log('Error retrieving image URL:', error);
        });
      
        // Append the new row to the table body
        tableBody.appendChild(newRow);

        totalSum += clothData.price;
        const totalSumText = document.getElementById('totalSum');
        totalSumText.textContent = `₽ ${totalSum}`;

        const delteFromCartButton = newRow.querySelector('#delteFromCartButton');
        delteFromCartButton.addEventListener('click', () => {
          console.log(itemId);
          deleteFromCart(itemId);
        });


        } else {
        console.log('Документ не найден!');
        }
    }).catch((error) => {
        console.log('Ошибка:', error);
    });
}

async function deleteFromCart(itemId){
  const shoppingCartRef = collection(db, 'shoppingCart');
  const itemDocRef = doc(shoppingCartRef, itemId);

  try {
    await deleteDoc(itemDocRef);
    console.log('Документ успешно удален из корзины');
    totalSum = 0;
    itemsCount = 0;
    const totalSumText = document.getElementById('totalSum');
    totalSumText.textContent = `₽ ${totalSum}`;
    getCart();
  } catch (error) {
    console.log('Ошибка при удалении документа:', error);
    showAlert("Не удалось удалить товар из корзины!");
  }
}

async function writeItemToPurchase(data, itemId){
  try{

    const userId = await getUserId();
    let idUser = userId;
    let color = data.idColor;
    let size = data.idSize;
    let idCloth = data.idCloth;


    const newPurchase = {
      size,
      color,
      idCloth,
      idUser,
    };
    totalSum = 0;
    itemsCount = 0;
    const purchaseCollection = collection(db, 'purchase');
    await addDoc(purchaseCollection, newPurchase);
    deleteFromCart(itemId);
  }catch (error) {
    showAlert("Не удалось добавить товар!");
  }
}

async function checkoutPurchase(){
  try{
    // Запрос данных из коллекции shoppingCart для конкретного пользователя
    const shoppingCartRef = collection(db, 'shoppingCart');
    // Запрос данных из коллекции shoppingCart для конкретного пользователя
    const userCartItemsQuery = query(shoppingCartRef, where('idUser', '==', userId));

    // Получение данных из запроса
    getDocs(userCartItemsQuery).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        // Доступ к данным каждого документа и вывод информации о каждом элементе одежды
        const data = doc.data();
        writeItemToPurchase(data, doc.id)
      });
    });
    showAlert("Производится оплата")
  }catch (error) {
    console.log('Ошибка при оплате:', error);
    showAlert("Не удалось оплатить покупку!");
  }
}



const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function() {
    localStorage.setItem('userId', 'ALL');
    
    exitButton.hidden = true;
    window.location.href = "catalog.html";

});
const favouritesSection = document.getElementById('favouritesSection');
if(userId !== 'ALL'){
  exitButton.hidden = false;
  favouritesSection.hidden = false;
}


const toCatalogButton = document.getElementById('toCatalogButton');
toCatalogButton.addEventListener('click', function() {
    window.location = 'catalog.html';
});

const checkoutButton = document.getElementById('checkoutButton');
checkoutButton.addEventListener('click', function() {
    if(itemsCount != 0) checkoutPurchase()
});

async function main(){
    await getCart();
}
  
main()






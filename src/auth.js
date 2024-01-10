import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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

const registerButton = document.getElementById('authButton');
registerButton.addEventListener('click', authUser);

async function authUser() {
    // Retrieve the values from the input fields
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
      // Пользователь найден, выполните вход в систему
      
        // Получите идентификатор пользователя из первого документа в результате запроса
      const userId = querySnapshot.docs[0].id;

      // Сохраните идентификатор пользователя в локальном хранилище
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
      }).then((result) => {
        /* Read more about handling dismissals below */
        if (result.dismiss === Swal.DismissReason.timer) {
          console.log("I was closed by the timer");
        }
        if(userId === '1'){
          window.location.href = "admin.html";
        }
        else window.location.href = "index.html";
      });  
    }
  }
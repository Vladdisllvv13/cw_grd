import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

const registerButton = document.getElementById('registerButton');
registerButton.addEventListener('click', registerUser);

async function registerUser() {
    // Retrieve the values from the input fields
    const surname = document.getElementById('surname').value;
    const name = document.getElementById('name').value;
    const middlename = document.getElementById('middlename').value;
    const email = document.getElementById('email').value;
    const gender = document.getElementById('gender').value;
    const password = document.getElementById('password').value;
  
    // Create a new user object
    const newUser = {
      surname,
      name,
      middlename,
      email,
      gender,
      password,
      idWardrobeClothes: [], // Initialize the idWardrobeClothes field as an empty array
      idFavourites: [],
      idFavouriteStyles: []
    };
  
    // Add the new user to the "users" collection in Firestore
    const usersCollection = collection(db, 'users');
    const docRef = await addDoc(usersCollection, newUser);
  

    // Get the ID of the newly created user document
    const userId = docRef.id;
    // Сохраните идентификатор пользователя в локальном хранилище
    localStorage.setItem('userId', userId);

    let timerInterval;
      Swal.fire({
        title: "Успешная регистрация!",
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
        window.location.href = "index.html";
      }); 
  }
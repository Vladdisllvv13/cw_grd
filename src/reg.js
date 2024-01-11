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

function validateEmail(email) {
  var pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(String(email).toLowerCase());
}

function validatePassword(password) {
  var pattern = /^(?=.*\d)(?=.*[a-zA-Z]).{6,20}$/;
  return pattern.test(password);
}

function validateFio(input) {
  var pattern = /^[а-яА-ЯёЁa-zA-Z]+$/;
  return pattern.test(input);
}

function showAlert(text){
  Swal.fire({
    icon: "error",
    title: "Упс...",
    text: text,
  });
  return;
}

async function registerUser() {
    // Retrieve the values from the input fields
    const surname = document.getElementById('surname').value;
    const name = document.getElementById('name').value;
    const middlename = document.getElementById('middlename').value;
    const email = document.getElementById('email').value;
    const gender = document.getElementById('gender').value;
    const password = document.getElementById('password').value;
    const passwordCopy = document.getElementById('passwordCopy').value;

    if(name.trim() === '' || surname.trim() === '' || middlename.trim() === '' || email.trim() === '' || password.trim() === ''){ showAlert("Вы не заполнили обязательные поля!"); return;}
    if(surname.length < 2){ showAlert("Ваша Фамилия слишком короткая"); return;}
    if(name.length < 2){ showAlert("Ваше Имя слишком короткое"); return;}
    if(middlename.length < 4){ showAlert("Ваше Отчество слишком короткое"); return;}
    if(!validateFio(surname)){ showAlert("Неверно введена Фамилия"); return;}
    if(!validateFio(name)){ showAlert("Неверно введено Имя"); return;}
    if(!validateFio(middlename)){ showAlert("Неверно введено Отчество"); return;}
    if(!validateEmail(email)){ showAlert("Неправильно введен адрес электронной почты!"); return;}
    if(!validatePassword(password)) { showAlert("Неверный формат пароля!"); return;}
    if(password.length < 7 && passwordCopy.length < 7){ showAlert("Пароль слишком короткий"); return;}
    if(password !== passwordCopy){ showAlert("Пароли не совпадают!"); return;}
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
'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDetails() {
    //prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.details = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDetails();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDetails();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//APP ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workout = [];
  #zoomLevel = 13;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    //event listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleInputFields.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._workoutPosition.bind(this)
    );
  }

  _getPosition() {
    if (navigator.geolocation) {
      //fetch current location
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Position could not be reached`);
        }
      );
    }
  }

  _loadMap(loc) {
    //fetch current location
    const { latitude } = loc.coords;
    const { longitude } = loc.coords;

    const coordinates = [latitude, longitude];

    this.#map = L.map('map').setView(coordinates, this.#zoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(wrk => this._renderMarker(wrk));
  }

  _showForm(e) {
    this.#mapEvent = e;
    //display workout form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _clearForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleInputFields() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //validation helper functions
    const inputValidator = (...inputs) =>
      inputs.every(int => Number.isFinite(int));
    const positiveInt = (...inputs) => inputs.every(int => int > 0);
    //get form data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    //if data is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //validate inputs
      if (
        !inputValidator(distance, duration, cadence) ||
        !positiveInt(distance, duration, cadence)
      )
        return alert(`Inputs must be a positive number`);
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //validate inputs
      if (
        !inputValidator(distance, duration, elevation) ||
        !positiveInt(distance, duration)
      )
        return alert(`Inputs must be a positive number`);
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //render workout as marker on map
    this._renderMarker(workout);
    //add new object to workout array
    this.#workout.push(workout);
    //render workout on list
    this._renderWorkout(workout);
    //clear input fields and hide form
    this._clearForm();
    //save to local storage
    this._setLocalStorage();
  }
  _renderMarker(workout) {
    // const { lat, lng } = this.#mapEvent.latlng;
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.details}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workoutwork--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.details}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _workoutPosition(e) {
    const target = e.target.closest('.workout');
    if (!target) return;
    const workout = this.#workout.find(wrk => wrk.id === target.dataset.id);
    this.#map.setView(workout.coords, this.#zoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _setLocalStorage(){
    localStorage.setItem('workouts', JSON.stringify(this.#workout))
  }
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    if(!data)return;
    this.#workout = data;
    this.#workout.forEach(wrk=> this._renderWorkout(wrk));
  }
  reset(){
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();

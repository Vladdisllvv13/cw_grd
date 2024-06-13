import * as THREE from 'three';
import Stats from 'stats.js';
import * as dat from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ui = document.getElementById('modalWindow');

const init = () => {

	const sizes = {
		width: ui.clientWidth / 1.2,
		height: window.innerHeight / 1.5,
	};
	

	const scene = new THREE.Scene();
	scene.background = new THREE.Color( '#393d3f' );
	scene.fog = new THREE.Fog('#393d3f', 20, 100);

	const canvas = document.querySelector('.canvas');

	
	const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
	camera.position.set(0,18,15);
	camera.lookAt(new THREE.Vector3(0,10,0));
	scene.add(camera);

	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.dampingFactor = 0.1;
	controls.maxPolarAngle = Math.PI / 2.1;
	controls.minPolarAngle = Math.PI / -1.2;
	controls.minDistance = 8;
	controls.maxDistance = 30;
	controls.target = new THREE.Vector3(0,10,0);

	

	// const gui = new dat.GUI();
	

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.physicallyCorrectLights = true;
	renderer.setPixelRatio( window.devicePixelRatio * 2);
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.setSize(sizes.width, sizes.height);

	renderer.render(scene, camera);

	return { sizes, scene, canvas, camera, renderer, controls};
};

export default init;
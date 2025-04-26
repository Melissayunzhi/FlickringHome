import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Flickr API and Texture Handling (For walls)
const apiKey = "1a26dfb5c8191081a0280122b5c054a6";
const groupId = "68964585@N00"; // Target Flickr Group ID (or use a gallery ID for curated images)

const camInfo = document.createElement('div');
camInfo.style.position = 'absolute';
camInfo.style.bottom = '10px';
camInfo.style.left = '10px';
camInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
camInfo.style.color = 'white';
camInfo.style.padding = '6px 10px';
camInfo.style.fontSize = '12px';
camInfo.style.zIndex = 1000;
camInfo.style.borderRadius = '4px';
camInfo.style.fontFamily = 'monospace';
document.body.appendChild(camInfo);
camInfo.style.display = 'none';


let showCameraInfo = false; // Toggle this to turn on/off
const fontStyle = "IBM Plex Mono, monospace";




// 1. Hover Highlights
let previousMaterial = null;
let previousObject = null;

// Renderer, Scene, and Camera Setup
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Set the clear color to transparent (opacity = 0)
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(5, 8, 15);
camera.lookAt(0, 3, 0);
camera.fov = 34;
camera.updateProjectionMatrix();


const orbitControls = new OrbitControls(camera, renderer.domElement);

// Set the controls target to a higher point to simulate a pan upward.
// This might be, for example, panning the view so it looks above the origin.
orbitControls.target.set(0, 3, 0); // Change (2) to whatever Y value gives you the desired effect.
orbitControls.update();

// Create a floor mesh with a default white material
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), floorMaterial);
floorMesh.rotation.x = -Math.PI / 2; // Lay flat on the XZ plane
floorMesh.position.y = 0;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// Immediately apply the tagged Flickr texture to the floor
applyPhotoToFloor(floorMesh);



// Walls Setup (Thick Walls with White Base)
const wallMaterial1 = new THREE.MeshStandardMaterial({ color: 0xffffff });
const wall1 = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 0.2), wallMaterial1);
wall1.position.set(0, 5, -7.5);
wall1.receiveShadow = true;
wall1.castShadow = true;
scene.add(wall1);

const wallMaterial2 = new THREE.MeshStandardMaterial({ color: 0xffffff });
const wall2 = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 0.2), wallMaterial2);
wall2.rotation.y = Math.PI / 2;
wall2.position.set(-7.5, 5, 0);
wall2.receiveShadow = true;
wall2.castShadow = true;
scene.add(wall2);

const wallMaterial3 = new THREE.MeshStandardMaterial({ color: 0xffffff });
const wall3 = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 0.2), wallMaterial3);
wall3.rotation.y = -Math.PI / 2;
wall3.position.set(7.5, 5, 0);
wall3.receiveShadow = true;
wall3.castShadow = true;
scene.add(wall3);

// Grid Helper
// const gridHelper = new THREE.GridHelper(15, 40);
// scene.add(gridHelper);

// Raycaster Setup for Texture Interaction (existing functionality)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredWall = null;
let changeTextureInterval = null;
setFlickrBackground();
  
// GLTFLoader for 3D Models
const loader = new GLTFLoader();


let sofaModel = null;

loader.load(
  'sofa.glb',
  (gltf) => {
    sofaModel = gltf.scene;
    sofaModel.position.set(-3, -1.7, 0);
    sofaModel.scale.set(3, 3, 3.5);
    sofaModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 1
          });
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("Sofa mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(sofaModel);
    scene.add(sofaModel);
    console.log('Sofa Model loaded:', sofaModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for sofa'),
  (error) => console.error('An error occurred while loading the sofa model:', error)
);

let smalltableModel = null;

loader.load(
  'smalltable.glb',
  (gltf) => {
    smalltableModel = gltf.scene;
    smalltableModel.position.set(-6, -0, 5);
    smalltableModel.scale.set(1, 1, 1);
    smalltableModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 1
          });
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("small table mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(smalltableModel);
    scene.add(smalltableModel);
    console.log('Sofa Model loaded:', smalltableModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for small table'),
  (error) => console.error('An error occurred while loading the samll table model:', error)
);


let floorlampModel = null;

loader.load(
  'floorlamp.glb',
  (gltf) => {
    floorlampModel = gltf.scene;
    floorlampModel.position.set(-6, 6, -5);
    floorlampModel.scale.set(0.8, 0.8, 0.8);

    floorlampModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 1
          });
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("floor lamp mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(floorlampModel);
    scene.add(floorlampModel);
    console.log('floor lamp Model loaded:', floorlampModel);
    
    // Create a spotlight at the floor lamp's position
    const floorLampSpotLight = new THREE.SpotLight(0xffe991, 15);
    floorLampSpotLight.castShadow = true;
    // Copy the position from the floor lamp or set an offset
    floorLampSpotLight.position.copy(floorlampModel.position);
    // For instance, if you want it slightly above the floor lamp:
    floorLampSpotLight.position.y += 1;
    floorLampSpotLight.position.x -= 0.;

    
    // Optionally, create and set a target for the spotlight
    const lampTarget = new THREE.Object3D();
    lampTarget.position.copy(floorlampModel.position);
    scene.add(lampTarget);
    floorLampSpotLight.target = lampTarget;
    
    scene.add(floorLampSpotLight);
    console.log('Floor Lamp Spotlight added at position:', floorLampSpotLight.position);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for floor lamp'),
  (error) => console.error('An error occurred while loading the floor lamp model:', error)
);

let starlampModel = null;

loader.load(
  'starlamp.glb',
  (gltf) => {
    starlampModel = gltf.scene;
    starlampModel.position.set(6, 0, 1.5);
    starlampModel.scale.set(0.05, 0.05, 0.05);

    starlampModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 1
          });
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("star lamp mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(starlampModel);
    scene.add(starlampModel);
    console.log('star lamp Model loaded:', starlampModel);
    
    // Create a spotlight at the floor lamp's position
    const floorLampSpotLight = new THREE.SpotLight(0xffe991, 15);
    floorLampSpotLight.castShadow = true;
    // Copy the position from the floor lamp or set an offset
    floorLampSpotLight.position.copy(floorlampModel.position);
    // For instance, if you want it slightly above the floor lamp:
    floorLampSpotLight.position.y += 1;
    floorLampSpotLight.position.x -= 0.;

    
    // Optionally, create and set a target for the spotlight
    const lampTarget = new THREE.Object3D();
    lampTarget.position.copy(floorlampModel.position);
    scene.add(lampTarget);
    floorLampSpotLight.target = lampTarget;
    
    scene.add(floorLampSpotLight);
    console.log('Floor Lamp Spotlight added at position:', floorLampSpotLight.position);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for floor lamp'),
  (error) => console.error('An error occurred while loading the floor lamp model:', error)
);

let smallshelfModel = null;

loader.load(
  'smallshelf.glb',
  (gltf) => {
    smallshelfModel = gltf.scene;
    smallshelfModel.position.set(1.9, 0.4, 0);
    smallshelfModel.scale.set(1.4, 1.4, 1.4);
    smallshelfModel.rotation.y = Math.PI ; // 30° rotation around the Z-axis

    smallshelfModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 1
          });
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("small shelf mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(smallshelfModel);
    scene.add(smallshelfModel);
    console.log('small shelf Model loaded:', smallshelfModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for sofa'),
  (error) => console.error('An error occurred while loading the sofa model:', error)
);

let foorrugModel = null;

loader.load(
  'floorrug.glb',
  (gltf) => {
    foorrugModel = gltf.scene;
    foorrugModel.position.set(-2, 0, 0);
    foorrugModel.scale.set(0.1, 0.1, 0.1);
    foorrugModel.rotation.y = Math.PI/2 ; // 30° rotation around the Z-axis

    foorrugModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 1
          });
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("floor rug mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(foorrugModel);
    scene.add(foorrugModel);
    console.log('floor rug  Model loaded:', foorrugModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for floor rug'),
  (error) => console.error('An error occurred while loading the floor rug model:', error)
);

let pillowsofaModel = null;

loader.load(
  'pillowsofa.glb',
  (gltf) => {
    pillowsofaModel = gltf.scene;
    pillowsofaModel.position.set(-3, 0, -2);
    pillowsofaModel.scale.set(1.2, 1.2, 1.2);
    pillowsofaModel.rotation.y = Math.PI ; // 180° rotation around the Z-axis

    pillowsofaModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("Sofa mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(pillowsofaModel);
    scene.add(pillowsofaModel);
    console.log('Pillow Sofa Model loaded:', pillowsofaModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for pillow sofa'),
  (error) => console.error('An error occurred while loading the pillow sofa model:', error)
);

let tableModel = null;

loader.load(
  'table.glb',
  (gltf) => {
    tableModel = gltf.scene;
    tableModel.position.set(1.5, -0.05, 13.5);
    tableModel.scale.set(4, 2.5, 4);
    tableModel.rotation.y = Math.PI/2 ; // 180° rotation around the Z-axis

    tableModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("Table mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(tableModel);
    scene.add(tableModel);
    console.log('Table Model loaded:', tableModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for table'),
  (error) => console.error('An error occurred while loading the table model:', error)
);

let magazineModel = null;

loader.load(
  'magazine.glb',
  (gltf) => {
    magazineModel = gltf.scene;
    magazineModel.position.set(0.5, -0.01, -2);
    magazineModel.scale.set(2, 2, 2);
    magazineModel.rotation.y = Math.PI/2 ; // 180° rotation around the Z-axis

    magazineModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("magazine mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(magazineModel);
    scene.add(magazineModel);
    console.log('magazine Model loaded:', magazineModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for magazine'),
  (error) => console.error('An error occurred while loading the magazine model:', error)
);

let tvModel = null;

loader.load(
  'tv.glb',
  (gltf) => {
    tvModel = gltf.scene;
    tvModel.position.set(-6, -1.5, -2);
    tvModel.scale.set(4, 4, 4);
    tvModel.rotation.y = Math.PI ; // 180° rotation around the Z-axis

    tvModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("tv mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyPhotoToTV(tvModel);
    scene.add(tvModel);
    console.log('tv Model loaded:', tvModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for tv'),
  (error) => console.error('An error occurred while loading the tv model:', error)
);

let radioModel = null;

loader.load(
  'radio.glb',
  (gltf) => {
    radioModel = gltf.scene;
    radioModel.position.set(-3.5, -1.15, 9);
    radioModel.scale.set(3, 3, 3);
     radioModel.rotation.y = Math.PI ; // 180° rotation around the Z-axis

    radioModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("radio mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(radioModel);
    scene.add(radioModel);
    console.log('radio Model loaded:', radioModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for radio'),
  (error) => console.error('An error occurred while loading the radio model:', error)
);

let towelsofaModel = null;

loader.load(
  'towelsofa.glb',
  (gltf) => {
    towelsofaModel = gltf.scene;
    towelsofaModel.position.set(-3, 0.9, -0.3);
    towelsofaModel.scale.set(1.2, 1.2, 1.2);
    towelsofaModel.rotation.y = Math.PI ; // 30° rotation around the Z-axis

    towelsofaModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("Sofa mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(towelsofaModel);
    scene.add(towelsofaModel);
    console.log('Towel Sofa Model loaded:', towelsofaModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for towel sofa'),
  (error) => console.error('An error occurred while loading the towel sofa model:', error)
);

let windowFrameModel = null;

loader.load(
  'windowframe.glb',
  (gltf) => {
    windowFrameModel = gltf.scene;
    windowFrameModel.position.set(0, -2, 4);
    windowFrameModel.scale.set(2, 2, 2);
    windowFrameModel.rotation.y = Math.PI ; // 180° rotation around the Z-axis

    windowFrameModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("window frame mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(windowFrameModel);
    scene.add(windowFrameModel);
    console.log('Window Frame Model loaded:', windowFrameModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for window frame '),
  (error) => console.error('An error occurred while loading the window frame model:', error)
);

let windowModel = null;

loader.load(
  'window.glb',
  (gltf) => {
    windowModel = gltf.scene;
    windowModel.position.set(0, -2, 5);
    windowModel.scale.set(2, 2, 2);
    windowModel.rotation.y = Math.PI ; // 180° rotation around the Z-axis

   
    windowModel.traverse((child) => {
        if (child.isMesh) {
          // Override with MeshBasicMaterial for the window model
          child.material = new THREE.MeshBasicMaterial({
            color: 0xffffff  // You might choose a default color if needed
          });
          child.castShadow = true;
          child.receiveShadow = true;
          if (!child.geometry.attributes.uv) {
            console.warn("Window mesh", child.name, "has no UV coordinates!");
          }
        }
      });
    // Apply the window-specific texture (using "sky" tagged images)
    applyPhotoToWindow(windowModel);
    scene.add(windowModel);
    console.log('Window Model loaded:', windowModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for window '),
  (error) => console.error('An error occurred while loading the window model:', error)
);

let smallplantModel = null;

loader.load(
  'smallplant.glb',
  (gltf) => {
    smallplantModel = gltf.scene;
    smallplantModel.position.set(2, 0.85,-3.8);
    smallplantModel.scale.set(2.5, 2.5, 2,5);

    smallplantModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("small plant mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(smallplantModel);
    scene.add(smallplantModel);
    console.log('Small plant Model loaded:', smallplantModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for window frame '),
  (error) => console.error('An error occurred while loading the window frame model:', error)
);

let curtainModel = null;

loader.load(
  'curtain.glb',
  (gltf) => {
    curtainModel = gltf.scene;
    curtainModel.position.set(-0.5, 0, -3.4);
    curtainModel.scale.set(0.04, .04, .04);

    curtainModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("curtain  mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(curtainModel);
    scene.add(curtainModel);
    console.log('Curtain loaded:', curtainModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for curtain '),
  (error) => console.error('An error occurred while loading the curtain model:', error)
);

let frameModel = null;
loader.load(
    'frame.glb', // Replace with your frame.glb path
    (gltf) => {
      frameModel = gltf.scene;
      // Position and scale the frame as desired
      frameModel.position.set(-2.98, 0, 2); // Example position; adjust as needed
      frameModel.scale.set(3, 3, 3);
      
      frameModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (!child.geometry.attributes.uv) {
            console.warn("Frame mesh", child.name, "has no UV coordinates!");
          }
        }
      });
      
      // Apply initial Flickr texture
      applyFlickrTextureToGLB(frameModel);
      
      scene.add(frameModel);
      console.log('Frame Model loaded:', frameModel);
    },
    (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for frame'),
    (error) => console.error('Error loading frame model:', error)
  );


let bedModel = null;

loader.load(
  'bed.glb',
  (gltf) => {
    bedModel = gltf.scene;
    bedModel.position.set(1, 0,-1);
    bedModel.scale.set(4, 4, 4);

    bedModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("bed mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(bedModel);
    scene.add(bedModel);
    console.log('Bed Model loaded:', bedModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for window frame '),
  (error) => console.error('An error occurred while loading the window frame model:', error)
);

let shelfModel = null;

loader.load(
  'shelves.glb',
  (gltf) => {
    shelfModel = gltf.scene;
    shelfModel.position.set(0.5, 2.3,-4);
    shelfModel.scale.set(0.05, 0.05, .03);
    shelfModel.rotation.y = Math.PI/2 ; // 180° rotation around the Z-axis
    shelfModel.rotation.x = Math.PI/2 ; // 180° rotation around the Z-axis

    shelfModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("shelves mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(shelfModel);
    scene.add(shelfModel);
    console.log('Shelves Model loaded:', shelfModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for window frame '),
  (error) => console.error('An error occurred while loading the window frame model:', error)
);

let bagModel = null;

loader.load(
  'shoulderbag.glb',
  (gltf) => {
    bagModel = gltf.scene;
    bagModel.position.set(0.8, -.1, 8);
    bagModel.scale.set(1.2, 1.2, 1.2);
    // bagModel.rotation.y = Math.PI/2 ; // 180° rotation around the Z-axis
    // bagModel.rotation.x = Math.PI/2 ; // 180° rotation around the Z-axis

    bagModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("bag mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(bagModel);
    scene.add(bagModel);
    console.log('bag Model loaded:', bagModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for window frame '),
  (error) => console.error('An error occurred while loading the window frame model:', error)
);

let posterModel = null;

loader.load(
  'posters.glb',
  (gltf) => {
    posterModel = gltf.scene;
    posterModel.position.set(1, 0,-1.5);
    posterModel.scale.set(4, 4, 4);

    posterModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("bed mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(posterModel);
    scene.add(posterModel);
    console.log('poster Model loaded:', posterModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for poster frame '),
  (error) => console.error('An error occurred while loading the poster frame model:', error)
);

let bedsheetModel = null;

loader.load(
  'bedsheet.glb',
  (gltf) => {
    bedsheetModel = gltf.scene;
    bedsheetModel.position.set(1, 0,-1);
    bedsheetModel.scale.set(4, 4, 4);

    bedsheetModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("bed sheet mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(bedsheetModel);
    scene.add(bedsheetModel);
    console.log('Bed sheet Model loaded:', bedsheetModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for bed sheet '),
  (error) => console.error('An error occurred while loading the bed sheeet model:', error)
);

let bedpillowModel = null;

loader.load(
  'bedpillow.glb',
  (gltf) => {
    bedpillowModel = gltf.scene;
    bedpillowModel.position.set(1, 0,-1);
    bedpillowModel.scale.set(4, 4, 4);

    bedpillowModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("bed pillow mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(bedpillowModel);
    scene.add(bedpillowModel);
    console.log('Bed pillow Model loaded:', bedpillowModel);
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for bed pillow '),
  (error) => console.error('An error occurred while loading the bed pillow model:', error)
);
let laptopModel = null;

loader.load(
  'laptop.glb',
  (gltf) => {
    laptopModel = gltf.scene;
    laptopModel.position.set(-0.4, -1,0);
    laptopModel.scale.set(3, 3, 3);

    laptopModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.uv) {
          console.warn("laptop mesh", child.name, "has no UV coordinates!");
        }
      }
    });
    applyFlickrTextureToGLB(laptopModel);
    scene.add(laptopModel);

    console.log('laptop Model loaded:', laptopModel);
// Create a spotlight to mimic laptop screen glow
const laptopLight = new THREE.SpotLight(0xcceeff, 50, 5, Math.PI / 6, 0.5);
laptopLight.castShadow = true;

// Position the light at the laptop screen's approximate position
// Slightly above and behind the screen area
laptopLight.position.set(2, 4, -1); // tweak as needed

// Create a target for the light to shine toward
const laptopLightTarget = new THREE.Object3D();
laptopLightTarget.position.set(6.4, 3, -2); // aim at keyboard or table
scene.add(laptopLightTarget);

laptopLight.target = laptopLightTarget;

// Optionally adjust shadow settings
laptopLight.shadow.mapSize.width = 1024;
laptopLight.shadow.mapSize.height = 1024;
laptopLight.shadow.bias = -0.0001;

scene.add(laptopLight);
console.log('Laptop Spotlight added at position:', laptopLight.position);

    
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for laptop pillow '),
  (error) => console.error('An error occurred while loading the laptop model:', error)
);

let doorModel = null;

loader.load(
    'door.glb',
    (gltf) => {
        doorModel = gltf.scene;
        doorModel.position.set(15.15, 0, 2);
        doorModel.scale.set(1.2, 1.5, 1.2);
        doorModel.rotation.y = Math.PI  /2; // 30° rotation around the Z-axis
  
        doorModel.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0,
                roughness: 1
              });
          child.castShadow = true;
          child.receiveShadow = true;
          if (!child.geometry.attributes.uv) {
            console.warn("Door mesh", child.name, "has no UV coordinates!");
          }
        }
      });
      applyFlickrTextureToGLB(doorModel);
      scene.add(doorModel);
      console.log('Door Model loaded:', doorModel);
    },
    (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for towel sofa'),
    (error) => console.error('An error occurred while loading the towel sofa model:', error)
  );

let doorblockModel = null;

loader.load(
      'doorblock.glb',
      (gltf) => {
        doorblockModel = gltf.scene;
        doorblockModel.position.set(-1, 0, 6);
        doorblockModel.scale.set(1.2, 1.5, 1.2);
        doorblockModel.rotation.y = 260 * (Math.PI / 180); // 260 rotation around the Z-axis
    
        doorblockModel.traverse((child) => {
          if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  metalness: 0,
                  roughness: 1
                });
            child.castShadow = true;
            child.receiveShadow = true;
            if (!child.geometry.attributes.uv) {
              console.warn("Door block mesh", child.name, "has no UV coordinates!");
            }
          }
        });
        applyFlickrTextureToGLB(doorblockModel);
        scene.add(doorblockModel);
        console.log('Door BLock Model loaded:', doorblockModel);
      },
      (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded for door block'),
      (error) => console.error('An error occurred while loading the door block model:', error)
    );


// async function fetchRandomPhoto() {
//   const randomPage = Math.floor(Math.random() * 10) + 1;
//   const apiUrl = `https://www.flickr.com/services/rest/?method=flickr.groups.pools.getPhotos&api_key=${apiKey}&group_id=${groupId}&format=json&nojsoncallback=1&per_page=50&page=${randomPage}`;
//   try {
//     const response = await fetch(apiUrl);
//     const data = await response.json();
//     const photos = data.photos.photo;
//     if (photos.length > 0) {
//       const randomIndex = Math.floor(Math.random() * photos.length);
//       const photo = photos[randomIndex];
//       const imageUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`;
//       console.log("Fetched Flickr URL:", imageUrl);  // <--- LOG HERE
//       return imageUrl;
//     }
//   } catch (error) {
//     console.error("Error fetching random group photo:", error);
//   }
//   return null;
// }
async function fetchRandomPhoto() {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const apiUrl = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&tags=home&min_upload_date=2004-01-01&max_upload_date=2012-12-31&sort=interestingness-desc&format=json&nojsoncallback=1&per_page=50&page=${randomPage}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const photos = data.photos.photo;

    if (photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * photos.length);
      const photo = photos[randomIndex];
      const imageUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`;
      console.log("Fetched faster random photo:", imageUrl);
      return imageUrl;
    }
  } catch (error) {
    console.error("Error fetching faster random photo:", error);
  }
  return null;
}



const placeholderTexture = new THREE.TextureLoader().load('path/to/placeholder.jpg'); // Provide a valid local path if needed

async function applyPhotoToWall(mesh) {
  const imageUrl = await fetchRandomPhoto();
  const textureLoader = new THREE.TextureLoader();
  const texture = imageUrl ? textureLoader.load(imageUrl) : placeholderTexture;
  mesh.material.map = texture;
  mesh.material.needsUpdate = true;
}

// Preload Initial Textures for Walls
async function preloadAndApplyInitialTextures() {
  await applyPhotoToWall(wall1);
  await applyPhotoToWall(wall2);
  await applyPhotoToWall(wall3);
}
preloadAndApplyInitialTextures();

// Helper function: checks if obj is a descendant of parent
function isDescendant(obj, parent) {
    let current = obj;
    while (current) {
      if (current === parent) return true;
      current = current.parent;
    }
    return false;
  }
  
  // Global variable to store the currently hovered object
  let hoveredObject = null;
  
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    // Build an array of hoverable objects: walls, floor, sofa, etc., and include windowModel.
    const hoverableObjects = [wall1, wall2, wall3, floorMesh];
    if (sofaModel) hoverableObjects.push(sofaModel);
    if (foorrugModel) hoverableObjects.push(foorrugModel);
    if (tableModel) hoverableObjects.push(tableModel);
    if (magazineModel) hoverableObjects.push(magazineModel);
    if (tvModel) hoverableObjects.push(tvModel);
    if (posterModel) hoverableObjects.push(posterModel);
    if (starlampModel) hoverableObjects.push(starlampModel);
    if (smalltableModel) hoverableObjects.push(smalltableModel);
    if (radioModel) hoverableObjects.push(radioModel);
    if (shelfModel) hoverableObjects.push(shelfModel);
    if (bagModel) hoverableObjects.push(bagModel);
    if (laptopModel) hoverableObjects.push(laptopModel);

    if (floorlampModel) hoverableObjects.push(floorlampModel);
    if (frameModel) hoverableObjects.push(frameModel);
    if (pillowsofaModel) hoverableObjects.push(pillowsofaModel);
    if (towelsofaModel) hoverableObjects.push(towelsofaModel);
    if (doorModel) hoverableObjects.push(doorModel);
    if (bedModel) hoverableObjects.push(bedModel);
    if (bedsheetModel) hoverableObjects.push(bedsheetModel);
    if (bedpillowModel) hoverableObjects.push(bedpillowModel);
    if (doorblockModel) hoverableObjects.push(doorblockModel);
    if (windowFrameModel) hoverableObjects.push(windowFrameModel);
    if (smallplantModel) hoverableObjects.push(smallplantModel);
    if (windowModel) hoverableObjects.push(windowModel);
    if (curtainModel) hoverableObjects.push(curtainModel);
  
    // Use recursive intersection checking:
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hoverableObjects, true);
    console.log("Intersects:", intersects);
  
    if (intersects.length > 0) {
      highlightObject(intersects[0].object);

      let target = intersects[0].object;
      
      // Check if the target belongs to windowModel using the helper function.
      if (windowModel && isDescendant(target, windowModel)) {
        target = windowModel;
      } else if (sofaModel && isDescendant(target, sofaModel)) {
        target = sofaModel;
      } else if (frameModel && isDescendant(target, frameModel)) {
        target = frameModel;
      }
      
      if (hoveredObject !== target) {
        hoveredObject = target;
        if (changeTextureInterval) clearInterval(changeTextureInterval);
        // Use different update functions based on the target:
        changeTextureInterval = setInterval(() => {
          if (target === floorMesh) {
            applyPhotoToFloor(target);
          } else if (target === tvModel) {
            applyPhotoToTV(target);
          } else if (windowModel && target === windowModel) {
            applyPhotoToWindow(target);
          } else if (target === sofaModel || target === frameModel || target === pillowsofaModel || target === towelsofaModel) {
            applyFlickrTextureToGLB(target);
          } else {
            applyPhotoToWall(target);
          }
        }, 700);
      }
    } else {
      hoveredObject = null;
      if (changeTextureInterval) {
        clearInterval(changeTextureInterval);
        changeTextureInterval = null;
      }
    }
  });
  
  

// // Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Reduced intensity for ambient light
 scene.add(ambientLight);
 const warmAmbient = new THREE.AmbientLight(0xffdab9, 0.5); // Peach Puff color, subtle intensity
 scene.add(warmAmbient);
 
 scene.fog = new THREE.Fog(0x141414, 15, 50);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
// directionalLight.position.set(5, 10, 15); // Positioned at an angle
// directionalLight.target.position.set(0, 5, 0);
// directionalLight.castShadow = true;

// // Configure shadow camera for the directional light:
// directionalLight.shadow.camera.left = -20;
// directionalLight.shadow.camera.right = 20;
// directionalLight.shadow.camera.top = 20;
// directionalLight.shadow.camera.bottom = -20;
// directionalLight.shadow.mapSize.width = 2048;
// directionalLight.shadow.mapSize.height = 2048;

// scene.add(directionalLight);
// scene.add(directionalLight.target);
// Create a directional light as usual
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// Set initial position and target for the directional light
directionalLight.position.set(5, 10, 0);
directionalLight.target.position.set(0, 5, 0);

// Instead of adding directionalLight directly to the scene,
// create a pivot (an empty Object3D) and add the light as a child.
const lightPivot = new THREE.Object3D();
lightPivot.position.set(0, 0, 0);  // Set pivot center (for example, the scene center or your target)
lightPivot.add(directionalLight);
lightPivot.add(directionalLight.target);  // Optionally add the target to the pivot if you want it to follow

// Add the pivot to the scene
scene.add(lightPivot);


// Optional: If using a spotlight for additional shadows:
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(10, 20, 10);
spotLight.castShadow = true;
scene.add(spotLight);

async function setFlickrBackground() {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const apiUrl = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&tags=home&min_upload_date=2005-01-01&max_upload_date=2015-12-31&format=json&nojsoncallback=1&per_page=50&page=${randomPage}`;
  
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    const photos = data.photos.photo;

    if (photos.length > 0) {
      const photo = photos[Math.floor(Math.random() * photos.length)];
      const imageUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`;

      document.getElementById('flickr-bg').style.backgroundImage = `url(${imageUrl})`;
      console.log('Flickr background set to:', imageUrl);
    }
  } catch (err) {
    console.error("Failed to load background image:", err);
  }
}

function startLoadingEffect() {
  renderer.domElement.classList.add('blurred');
}

function stopLoadingEffect() {
  renderer.domElement.classList.remove('blurred');
}


async function applyFlickrTextureToGLB(object) {
  startLoadingEffect(); // <-- start blur when beginning to load

    const imageUrl = await fetchRandomPhoto();
    if (!imageUrl) {
      stopLoadingEffect();

      console.warn("No image URL returned from fetchRandomPhoto().");
      return;
    }
    
    console.log("applyFlickrTextureToGLB - received URL:", imageUrl);
    
    const textureLoader = new THREE.TextureLoader();
    
    object.traverse((child) => {
      if (child.isMesh) {
        console.log("Updating mesh material for child:", child.name);
        
        // For testing, try using a MeshBasicMaterial to ignore lighting effects.
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff
        });
        
        textureLoader.load(
          imageUrl,
          (texture) => {
            console.log("Texture loaded, applying to:", child.name);
            if (object === sofaModel  || isDescendant(child, windowModel)) {
                texture.center.set(0.5, 0.5);  // Set the pivot to the texture's center
                texture.rotation = Math.PI ; // Random rotation between 0 and 360 degrees
              }

            texture.encoding = THREE.sRGBEncoding;
            child.material.map = texture;
            child.material.needsUpdate = true;
            stopLoadingEffect(); // <-- remove blur after loaded

            // Log the material's map to verify it's not null.
            console.log("child.material.map:", child.material.map);
          },
          undefined,
        (err) => {
          console.error("Error loading flickr texture:", err);
          stopLoadingEffect(); // <-- remove blur if error too
        }
        );
        
        // Optionally, check if the mesh has valid UV coordinates:
        if (!child.geometry.attributes.uv) {
          console.warn("Mesh", child.name, "has no UV coordinates!");
        }
      }
    });
  }
  
function highlightObject(object) {
  if (!object || object === previousObject) return;
  
  // Reset previous highlight
  if (previousObject && previousMaterial) {
    previousObject.material.emissive.set(0x000000);
  }

  if (object.material && object.material.emissive) {
    object.material.emissive.set(0x333333);
    previousMaterial = object.material;
    previousObject = object;
  }
}
  


function applyFlickrTextureToMesh(child) {
    const textureLoader = new THREE.TextureLoader();
    // Ensure the texture is loaded before applying it:
    textureLoader.load(
      imageUrl, // Assuming imageUrl is already defined and valid
      (loadedTexture) => {
        // Optionally set encoding if needed:
        // loadedTexture.encoding = THREE.sRGBEncoding;
        child.material.map = loadedTexture;
        child.material.needsUpdate = true;
        console.log('Texture applied to mesh:', child);
      },
      undefined,
      (error) => {
        console.error("Error loading texture:", error);
      }
    );
  }
  
  async function fetchTagPhoto(tag) {
    const baseUrl = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&tags=${tag}&min_upload_date=2004-01-01&max_upload_date=2012-12-31&format=json&nojsoncallback=1&per_page=50&sort=random`;
  
    try {
      const initialResponse = await fetch(baseUrl + `&page=1`);
      const initialData = await initialResponse.json();
      const totalPages = Math.min(initialData.photos.pages, 4000 / 50); // Flickr limits
  
      const randomPage = Math.floor(Math.random() * totalPages) + 1;
      const response = await fetch(baseUrl + `&page=${randomPage}`);
      const data = await response.json();
      const photos = data.photos.photo;
  
      if (photos.length > 0) {
        const randomIndex = Math.floor(Math.random() * photos.length);
        const photo = photos[randomIndex];
        const imageUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`;
        console.log(`Fetched Flickr URL for tag "${tag}":`, imageUrl);
        return imageUrl;
      }
    } catch (error) {
      console.error(`Error fetching Flickr photo for tag "${tag}":`, error);
    }
    return null;
  }
  
  function applyPhotoToFloor(mesh) {
    fetchTagPhoto("flooring").then((imageUrl) => {
      const textureLoader = new THREE.TextureLoader();
      const texture = imageUrl ? textureLoader.load(imageUrl) : placeholderTexture;
      // Traverse the floor mesh in case it is a group (usually not needed for a simple plane)
      mesh.traverse(child => {
        if (child.isMesh) {
          // Create a material if not present
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 1 });
          }
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    });
  }
  
  function applyPhotoToWindow(mesh) {
    fetchTagPhoto("clouds").then((imageUrl) => {
      const textureLoader = new THREE.TextureLoader();
      const texture = imageUrl ? textureLoader.load(imageUrl) : placeholderTexture;
  
      // Set the texture pivot and rotate it 180°:
      texture.center.set(0.5, 0.5); // Pivot around the center
      texture.rotation = Math.PI;   // 180° rotation (in radians)
  
      mesh.traverse(child => {
        if (child.isMesh) {
          // If the mesh doesn’t have a material, create one
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: 0xffffff,
              metalness: 0,
              roughness: 1
            });
          }
          // If the material is an array, update each element:
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.map = texture;
              mat.needsUpdate = true;
            });
          } else {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        }
      });
    });
  }
  function applyPhotoToTV(mesh) {
    fetchTagPhoto("home").then((imageUrl) => {
      const textureLoader = new THREE.TextureLoader();
      const texture = imageUrl ? textureLoader.load(imageUrl) : placeholderTexture;
  
      // Center the texture pivot and flip 180°
      texture.center.set(0.5, 0.5);
      texture.rotation = Math.PI;
  
      mesh.traverse(child => {
        if (child.isMesh) {
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: 0xffffff,
              metalness: 0,
              roughness: 1
            });
          }
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.map = texture;
              mat.needsUpdate = true;
            });
          } else {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        }
      });
    });
  }
  
  const tagInput = document.createElement('input');
  tagInput.placeholder = "Enter #tag (e.g. #clouds)";
  tagInput.style.position = 'absolute';
  tagInput.style.top = '10px';
  tagInput.style.left = '10px';
  tagInput.style.zIndex = 100;
  tagInput.style.margin = '4px';
  tagInput.style.padding = '5px 10px';
  tagInput.style.fontFamily = fontStyle;
  tagInput.style.backgroundColor = '#fff';
  // tagInput.style.border = '1px solid #ccc';
  tagInput.style.borderRadius = '4px';
  tagInput.style.fontSize = '14px';
  tagInput.style.outline = 'none';
  
  document.body.appendChild(tagInput);
  
  tagInput.addEventListener('change', () => {
    const tag = tagInput.value.replace('#', '');
    scene.traverse((child) => {
      if (child.isMesh) {
        applyTagTexture(child, tag);
      }
    });
  });
  
  async function applyTagTexture(mesh, tag) {
    const imageUrl = await fetchTagPhoto(tag);
    if (!imageUrl) return;
  
    const texture = new THREE.TextureLoader().load(imageUrl);
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  }
// 2. First-Person Controls Setup
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// When clicking on the page:
document.addEventListener('click', (event) => {
  // Check if the click is inside a UI element
  const isUIElement = event.target.closest('button, input, #aboutPopup, #screenshotBtn, #aboutBtn, #tagInput');

  if (!isUIElement) {
    // If click is NOT on a UI element, lock the controls
    controls.lock();
  }
});


const move = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 50.0;

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW': move.forward = true; break;
    case 'ArrowLeft':
    case 'KeyA': move.left = true; break;
    case 'ArrowDown':
    case 'KeyS': move.backward = true; break;
    case 'ArrowRight':
    case 'KeyD': move.right = true; break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW': move.forward = false; break;
    case 'ArrowLeft':
    case 'KeyA': move.left = false; break;
    case 'ArrowDown':
    case 'KeyS': move.backward = false; break;
    case 'ArrowRight':
    case 'KeyD': move.right = false; break;
  }
});

const buttonStyles = `

  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  margin: 4px;
  padding: 5px 10px;
  font-size: 14px;
  font-family: IBM Plex Mono, monospace;
  padding: 5px 10px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;

`;

['overview', 'sofa view', 'bed view'].forEach((label, i) => {
  const btn = document.createElement('button');
  btn.innerText = label;
  btn.style.cssText = buttonStyles;
  btn.style.top = `${10 + i * 50}px`; // Stack vertically
  btn.addEventListener('click', () => setCameraView(i));
  document.body.appendChild(btn);
});
document.querySelectorAll("button").forEach(btn => {
  btn.style.fontFamily = fontStyle;
});

const screenshotButton = document.createElement('button');
screenshotButton.innerText = '📸 Screenshot';
screenshotButton.style.position = 'absolute';
screenshotButton.style.bottom = '10px';
screenshotButton.style.left = '10px';
screenshotButton.style.zIndex = 100;
screenshotButton.style.padding = '5px 10px';
screenshotButton.style.margin = '4px';
screenshotButton.style.fontFamily = fontStyle;
screenshotButton.style.backgroundColor = '#fff';
screenshotButton.style.border = '1px solid #ccc';
screenshotButton.style.borderRadius = '4px';
screenshotButton.style.fontSize = '14px';
screenshotButton.style.cursor = 'pointer';
document.body.appendChild(screenshotButton);
screenshotButton.addEventListener('click', () => {
  renderer.render(scene, camera); // Make sure latest frame is drawn
  const screenshot = renderer.domElement.toDataURL('image/png');
  
  const link = document.createElement('a');
  link.href = screenshot;
  link.download = 'screenshot.png';
  link.click();
});
screenshotButton.addEventListener('mouseenter', () => {
  screenshotButton.style.backgroundColor = '#eee';
});
screenshotButton.addEventListener('mouseleave', () => {
  screenshotButton.style.backgroundColor = '#fff';
});


function setCameraView(viewIndex) {
  switch (viewIndex) {
    case 0:
      camera.position.set(5, 8, 15);
      camera.lookAt(0, 3, 0);
      break;
    case 1:
      camera.position.set (-7.00, 5.39, 4.52);
      camera.lookAt (0.09, 1.13, -1.09)
      break;
    case 2:
      camera.position.set(6.82, 2.69, -5.03);
      camera.lookAt(-0.97, 1.72, 1.16);
      break;
  }
  camera.updateProjectionMatrix();
}


// // 2. Camera Flythrough (Cinematic Intro)
// const flythroughPoints = [
//   new THREE.Vector3(10, 5, 20),
//   new THREE.Vector3(0, 5, 10),
//   new THREE.Vector3(-10, 5, 5),
//   new THREE.Vector3(0, 5, 0),
// ];

// let flyIndex = 0;
// let flyStart = null;
// let flyDuration = 3000; // ms
// let flying = true;

// function animateFlythrough(time) {
//   if (!flyStart) flyStart = time;

//   const elapsed = time - flyStart;
//   const t = Math.min(elapsed / flyDuration, 1);

//   const current = flythroughPoints[flyIndex];
//   const next = flythroughPoints[(flyIndex + 1) % flythroughPoints.length];
//   camera.position.lerpVectors(current, next, t);
//   camera.lookAt(0, 2, 0);
//   orbitControls.target.set(0, 2, 0);

//   if (t >= 1) {
//     flyIndex = (flyIndex + 1) % flythroughPoints.length;
//     flyStart = time;
//   }
// }

const lookTargetInfo = document.createElement('div');
lookTargetInfo.style.position = 'absolute';
lookTargetInfo.style.bottom = '60px';
lookTargetInfo.style.left = '10px';
lookTargetInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
lookTargetInfo.style.color = 'white';
lookTargetInfo.style.padding = '6px 10px';
lookTargetInfo.style.fontSize = '12px';
lookTargetInfo.style.zIndex = 1000;
lookTargetInfo.style.borderRadius = '4px';
lookTargetInfo.style.fontFamily = 'monospace';
document.body.appendChild(lookTargetInfo);
lookTargetInfo.style.display = 'none';

const clock = new THREE.Clock();
function animateObjects() {
  const t = clock.getElapsedTime();

  if (typeof curtainModel !== 'undefined' && curtainModel) curtainModel.rotation.z = Math.sin(t * 2) * 0.05;
  if (typeof floorlampModel !== 'undefined' && floorlampModel) floorlampModel.rotation.y = Math.sin(t) * 0.02;
  if (typeof tvModel !== 'undefined' && tvModel) {
    const intensity = 0.5 + Math.sin(t * 10) * 0.5;
    tvModel.traverse((child) => {
      if (child.isMesh && child.material.emissive) {
        child.material.emissiveIntensity = intensity;
      }
    });
  }
}
const aboutBtn = document.getElementById('aboutBtn');
const aboutPopup = document.getElementById('aboutPopup');

// When mouse enters the button area
aboutBtn.addEventListener('mouseenter', () => {
  aboutPopup.style.opacity = 1;
  aboutPopup.style.pointerEvents = 'auto';
});

// When mouse leaves the button
aboutBtn.addEventListener('mouseleave', () => {
  aboutPopup.style.opacity = 0;
  aboutPopup.style.pointerEvents = 'none';
});


let idleTimer;
let idleTime = 10 * 1000; // 30 seconds
let autoViewInterval;
let currentView = 1;

// Set up event listeners to detect activity
function resetIdleTimer() {
  clearTimeout(idleTimer);
  clearInterval(autoViewInterval);
  idleTimer = setTimeout(startAutoViews, idleTime);
}

['mousemove', 'keydown', 'click', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetIdleTimer);
});

function startAutoViews() {
  autoViewInterval = setInterval(() => {
    currentView = (currentView + 1) % 3; // Cycle through 0,1,2
    setCameraView(currentView);
  }, 5000); // Switch every 5 seconds
}

// Initially start watching for idle
resetIdleTimer();

function animate(time) {
  const delta = clock.getDelta();

  direction.z = Number(move.forward) - Number(move.backward);
  direction.x = Number(move.right) - Number(move.left);
  direction.normalize();

  if (controls.isLocked) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    if (move.forward || move.backward) velocity.z -= direction.z * speed * delta;
    if (move.left || move.right) velocity.x -= direction.x * speed * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }
  // if (flying) animateFlythrough(time);
  // animateObjects();


  if (showCameraInfo) {
    const pos = camera.position;
    const rot = camera.rotation;
    camInfo.innerText = `
      position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})
      rotation: (${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)})
    `;
    const lookTarget = getCameraLookAtTarget(camera);
    lookTargetInfo.innerText = `camera.lookAt(${lookTarget.x.toFixed(2)}, ${lookTarget.y.toFixed(2)}, ${lookTarget.z.toFixed(2)})`;
  }
  
  lightPivot.rotation.y += 0.002;
  renderer.render(scene, camera);
}

// Helper: get world position the camera is looking at
function getCameraLookAtTarget(camera, distance = 10) {
  const dir = new THREE.Vector3(); // direction vector
  camera.getWorldDirection(dir);  // get current direction
  const pos = camera.position.clone(); // current position
  return pos.add(dir.multiplyScalar(distance));
}

const lookAtTarget = getCameraLookAtTarget(camera);
console.log('Use in preset:');
console.log(`camera.lookAt(${lookAtTarget.x.toFixed(2)}, ${lookAtTarget.y.toFixed(2)}, ${lookAtTarget.z.toFixed(2)})`);


document.addEventListener('keydown', (e) => {
  if (e.key === "`") {
    showCameraInfo = !showCameraInfo;
    camInfo.style.display = showCameraInfo ? 'block' : 'none';
  }
});

renderer.setAnimationLoop(animate);

// MAZE GENERATION CODE ADAPTED FROM https://www.the-art-of-web.com/javascript/maze-generator/ 
// Original JavaScript code by Chirp Internet: chirpinternet.eu
// Please acknowledge use of this code by including this header
class MazeBuilder {

  constructor(width, height) {

    this.width = width;
    this.height = height;

    this.cols = 2 * this.width + 1;
    this.rows = 2 * this.height + 1;

    this.maze = this.initArray([]);

    // place initial walls
    this.maze.forEach((row, r) => {
      row.forEach((cell, c) => {
        switch (r) {
          case 0:
          case this.rows - 1:
            this.maze[r][c] = ["wall"];
            break;

          default:
            if ((r % 2) == 1) {
              if ((c == 0) || (c == this.cols - 1)) {
                this.maze[r][c] = ["wall"];
              }
            } else if (c % 2 == 0) {
              this.maze[r][c] = ["wall"];
            }

        }
      });

      if (r == 0) {
        // place exit in top row
        let doorPos = this.posToSpace(this.rand(1, this.width));
        this.maze[r][doorPos] = ["door", "exit"];
      }

      if (r == this.rows - 1) {
        // place entrance in bottom row
        let doorPos = this.posToSpace(this.rand(1, this.width));
        this.maze[r][doorPos] = ["door", "entrance"];
      }

    });

    // start partitioning
    this.partition(1, this.height - 1, 1, this.width - 1);
  }

  initArray(value) {
    return new Array(this.rows).fill().map(() => new Array(this.cols).fill(value));
  }

  rand(min, max) {
    return min + Math.floor(Math.random() * (1 + max - min));
  }

  posToSpace(x) {
    return 2 * (x - 1) + 1;
  }

  posToWall(x) {
    return 2 * x;
  }

  inBounds(r, c) {
    if ((typeof this.maze[r] == "undefined") || (typeof this.maze[r][c] == "undefined")) {
      return false; // out of bounds
    }
    return true;
  }

  shuffle(array) {
    // sauce: https://stackoverflow.com/a/12646864
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  partition(r1, r2, c1, c2) {
    // create partition walls
    // ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method

    let horiz, vert, x, y, start, end;

    if ((r2 < r1) || (c2 < c1)) {
      return false;
    }

    if (r1 == r2) {
      horiz = r1;
    } else {
      x = r1 + 1;
      y = r2 - 1;
      start = Math.round(x + (y - x) / 4);
      end = Math.round(x + 3 * (y - x) / 4);
      horiz = this.rand(start, end);
    }

    if (c1 == c2) {
      vert = c1;
    } else {
      x = c1 + 1;
      y = c2 - 1;
      start = Math.round(x + (y - x) / 3);
      end = Math.round(x + 2 * (y - x) / 3);
      vert = this.rand(start, end);
    }

    for (let i = this.posToWall(r1) - 1; i <= this.posToWall(r2) + 1; i++) {
      for (let j = this.posToWall(c1) - 1; j <= this.posToWall(c2) + 1; j++) {
        if ((i == this.posToWall(horiz)) || (j == this.posToWall(vert))) {
          this.maze[i][j] = ["wall"];
        }
      }
    }

    let gaps = this.shuffle([true, true, true, false]);

    // create gaps in partition walls

    if (gaps[0]) {
      let gapPosition = this.rand(c1, vert);
      this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = [];
    }

    if (gaps[1]) {
      let gapPosition = this.rand(vert + 1, c2 + 1);
      this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = [];
    }

    if (gaps[2]) {
      let gapPosition = this.rand(r1, horiz);
      this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = [];
    }

    if (gaps[3]) {
      let gapPosition = this.rand(horiz + 1, r2 + 1);
      this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = [];
    }

    // recursively partition newly created chambers

    this.partition(r1, horiz - 1, c1, vert - 1);
    this.partition(horiz + 1, r2, c1, vert - 1);
    this.partition(r1, horiz - 1, vert + 1, c2);
    this.partition(horiz + 1, r2, vert + 1, c2);

  }

  isGap(...cells) {
    return cells.every((array) => {
      let row, col;
      [row, col] = array;
      if (this.maze[row][col].length > 0) {
        if (!this.maze[row][col].includes("door")) {
          return false;
        }
      }
      return true;
    });
  }

  countSteps(array, r, c, val, stop) {

    if (!this.inBounds(r, c)) {
      return false; // out of bounds
    }

    if (array[r][c] <= val) {
      return false; // shorter route already mapped
    }

    if (!this.isGap([r, c])) {
      return false; // not traversable
    }

    array[r][c] = val;

    if (this.maze[r][c].includes(stop)) {
      return true; // reached destination
    }

    this.countSteps(array, r - 1, c, val + 1, stop);
    this.countSteps(array, r, c + 1, val + 1, stop);
    this.countSteps(array, r + 1, c, val + 1, stop);
    this.countSteps(array, r, c - 1, val + 1, stop);

  }

  getKeyLocation() {

    let fromEntrance = this.initArray();
    let fromExit = this.initArray();

    this.totalSteps = -1;

    for (let j = 1; j < this.cols - 1; j++) {
      if (this.maze[this.rows - 1][j].includes("entrance")) {
        this.countSteps(fromEntrance, this.rows - 1, j, 0, "exit");
      }
      if (this.maze[0][j].includes("exit")) {
        this.countSteps(fromExit, 0, j, 0, "entrance");
      }
    }

    let fc = -1, fr = -1;

    this.maze.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (typeof fromEntrance[r][c] == "undefined") {
          return;
        }
        let stepCount = fromEntrance[r][c] + fromExit[r][c];
        if (stepCount > this.totalSteps) {
          fr = r;
          fc = c;
          this.totalSteps = stepCount;
        }
      });
    });

    return [fr, fc];
  }

  placeKey() {

    let fr, fc;
    [fr, fc] = this.getKeyLocation();

    this.maze[fr][fc] = ["key"];

  }


}

// TEXTURES FROM
// Forest Ground: https://3dtextures.me/2020/03/20/ground-forest-003/
// Wood Plank: https://ambientcg.com/view?id=Planks012
// HDRI Sky: https://www.hdri-hub.com/hdrishop/freesamples/freehdri/item/76-hdr-sky-cloudy

// SOUNDS FROM
// cheese_collect.wav: https://freesound.org/people/ProjectsU012/sounds/341695/
// fell_down.wav: https://freesound.org/people/MentosLat/sounds/417486/



import * as THREE from '../libraries/build/three.module.js';
import { GLTFLoader } from "../libraries/loaders_controls/GLTFLoader.js";
import { PointerLockControls } from '../libraries/loaders_controls/PointerLockControls.js';
import { RGBELoader } from '../libraries/loaders_controls/RGBELoader.js';
let camera, scene, renderer, controls;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let cheese;
let bbox;
let cheese_hitbox;
let trap_hitbox;
let skyGeo;
let change_cam = false;
let rat;
let mousetrap;
let cheese_loc;
let trap_loc;
var geometries = [];
let cheese_arr = [];
let cheese_collect;
let fell_down;
let audio_loader;
let score_html;
let score = 0;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();


// Load our textures using TextureLoader
const textureLoader = new THREE.TextureLoader();

const grass_color = textureLoader.load("../assets/materials/Ground_Forest_003_baseColor.jpg");
const grass_normal = textureLoader.load("../assets/materials/Ground_Forest_003_normal.jpg");
const grass_disp = textureLoader.load("../assets/materials/Ground_Forest_003_height.png");
const grass_ao = textureLoader.load("../assets/materials/Ground_Forest_003_ambientOcclusion.jpg");
const grass_rough = textureLoader.load("../assets/materials/Ground_Forest_003_ROUGH.jpg");
grass_color.wrapS = grass_normal.wrapS = grass_ao.wrapS = grass_disp.wrapS = grass_rough.wrapS = THREE.RepeatWrapping;
grass_color.wrapT = grass_normal.wrapT = grass_ao.wrapT = grass_disp.wrapT = grass_rough.wrapT = THREE.RepeatWrapping;
grass_color.repeat.set(20, 20);
grass_normal.repeat.set(20, 20);
grass_disp.repeat.set(20, 20);
grass_ao.repeat.set(20, 20);
grass_rough.repeat.set(20, 20);


const skydometexture = textureLoader.load("../assets/materials/HDR_029_Sky_Cloudy_Bg.jpg");
var envmap = new RGBELoader().load( "../assets/materials/HDR_029_Sky_Cloudy_Env.hdr" );


const plank_color = textureLoader.load("../assets/materials/Planks012_1K_Color.jpg");
const plank_normal = textureLoader.load("../assets/materials/Planks012_1K_NormalDX.jpg");
const plank_disp = textureLoader.load("../assets/materials/Planks012_1K_Displacement.jpg");
const plank_ao = textureLoader.load("../assets/materials/Planks012_1K_AmbientOcclusion.jpg");
const plank_rough = textureLoader.load("../assets/materials/Planks012_1K_Roughness.jpg");

plank_color.wrapS = plank_normal.wrapS = plank_disp.wrapS = plank_ao.wrapS = plank_rough.wrapS = THREE.RepeatWrapping;
plank_color.wrapT = plank_normal.wrapT = plank_disp.wrapT = plank_ao.wrapT = plank_rough.wrapS = THREE.RepeatWrapping;
plank_color.repeat.set(0.5, 0.5);
plank_normal.repeat.set(0.5, 0.5);
plank_disp.repeat.set(0.5, 0.5);
plank_ao.repeat.set(0.5, 0.5);
plank_rough.repeat.set(0.5, 0.5);


load_gltf();
init();
animate();

// Load our models using the GLTFLoader
function load_gltf() {
  const loader = new GLTFLoader();
  loader.load(
    // resource URL
    '../assets/models/cheese.glb',
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.scale.set(3, 3, 3);
      cheese = gltf.scene;
      scene.add(cheese);

      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object

    },
    // called while loading is progressing
    function (xhr) {

      console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

      console.log('An error happened');

    }
  );

  loader.load(
    // resource URL
    '../assets/models/rat.glb',
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.scale.set(5, 5, 5);
      rat = gltf.scene;
      scene.add(rat);
      rat.visible = false;
      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object

    },
    // called while loading is progressing
    function (xhr) {

      console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

      console.log('An error happened');

    }
  );

  loader.load(
    // resource URL
    '../assets/models/mousetrap.glb',
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.scale.set(8, 8, 8);
      mousetrap = gltf.scene;
      mousetrap.rotateY(Math.PI);
      scene.add(mousetrap);
      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object

    },
    // called while loading is progressing
    function (xhr) {

      console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

      console.log('An error happened');

    }
  );
}


function init() {

  // Create our maze and initiate our camera and scene 
  let Maze = new MazeBuilder(9, 9);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.y = 5;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x83bcfc);

  // Initiate our audio listener for sound effects to work
  const audio_listener = new THREE.AudioListener();
  camera.add(audio_listener);
  cheese_collect = new THREE.Audio(audio_listener);
  scene.add(cheese_collect);
  fell_down = new THREE.Audio(audio_listener);
  scene.add(fell_down);

  // load our sounds
  audio_loader = new THREE.AudioLoader();


  audio_loader.load(
    // resource URL
    '../assets/audio/cheese_collect.wav',

    // onLoad callback
    function (audioBuffer) {
      // set the audio object buffer to the loaded object
      cheese_collect.setBuffer(audioBuffer);
      cheese_collect.setVolume(0.5);
    }
  );

  audio_loader.load(
    // resource URL
    '../assets/audio/fell_down.wav',

    // onLoad callback
    function (audioBuffer) {
      // set the audio object buffer to the loaded object
      fell_down.setBuffer(audioBuffer);
      fell_down.setVolume(0.5);
    }
  );

  // Create lights
  const light = new THREE.HemisphereLight(0xeeeeff, 0xeeeeff, 1);
  light.position.set(0, 1, 0.75);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xe8fffb, 0.5);
  scene.add(directionalLight);
  // Add Pointer Lock controls to allow mouse move camera
  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById('blocker');
  const win_html = document.getElementById('gamefinished');
  const instructions = document.getElementById('instructions');
  score_html = document.getElementById('score');

  instructions.addEventListener('click', function () {

    controls.lock();

  });

  controls.addEventListener('lock', function () {

    instructions.style.display = 'none';
    blocker.style.display = 'none';
    win_html.style.display = 'none';
    score_html.innerHTML = "SCORE " + score;
    console.log("LOCKED");

  });

  controls.addEventListener('unlock', function () {

    blocker.style.display = 'block';
    instructions.style.display = '';
    console.log("UNLOCKED");

  });

  scene.add(controls.getObject());


  // Events for when certain keys are pressed

  const onKeyDown = function (event) {

    switch (event.code) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'Space':
        if (!change_cam) {
          if (canJump === true) velocity.y += 350;
          canJump = false;
          break;
        }
        break;


      case 'KeyU':
        change_view();
        break;

    }

  };

  const onKeyUp = function (event) {

    switch (event.code) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

    }

  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

  // floor

  let floorGeometry = new THREE.PlaneGeometry(1500, 1500, 100, 100);
  floorGeometry.rotateX(- Math.PI / 2);
  const floorMaterial = new THREE.MeshPhongMaterial({ map: grass_color, normalMap: grass_normal, aoMap: grass_ao, displacementMap: grass_disp, displacementScale: 3 });

  // skydome
  skyGeo = new THREE.SphereGeometry(750, 25, 25);
  var skymaterial = new THREE.MeshBasicMaterial({ map: skydometexture });
  skymaterial.side = THREE.BackSide;
  var sky = new THREE.Mesh(skyGeo, skymaterial);
  scene.add(sky);
  sky.position.y = -90;


  //envmap
  scene.environment = envmap;


  // hitbox
  cheese_hitbox = new THREE.Box3();
  trap_hitbox = new THREE.Box3();


  // maze objects
  const boxGeometry = new THREE.BoxGeometry(10, 50, 10);
  const boxMaterial = new THREE.MeshPhongMaterial({ map: plank_color, normalMap: plank_normal, aoMap: plank_ao, displacementMap: plank_disp, displacementScale: 0.1 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);
  var group = new THREE.Group();

  for (var j = 0; j < Maze.cols; j++) {
    for (var i = 0; i < Maze.rows; i++) {

      if (Maze.maze[i][j] != "wall") {

        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.x = (j * 10) - 100;
        box.position.z = (i * 10) - 100;
        box.position.y = 25;
        group.add(box);
        objects.push(box);
      }
    }
  }
  scene.add(group);
  // get random value from our maze array
  var box_item = objects[Math.floor(Math.random() * objects.length)];
  // set camera position to their
  controls.getObject().position.x = box_item.position.x;
  controls.getObject().position.z = box_item.position.z;
  controls.getObject().position.y = box_item.position.y + 50;

  // get another random location to put our cheese model
  cheese_loc = objects[Math.floor(Math.random() * objects.length)];

  // get another location for mousetrap

  trap_loc = objects[Math.floor(Math.random() * objects.length)];

  while ((cheese_loc.position.equals(trap_loc.position))) {
    trap_loc = objects[Math.floor(Math.random() * objects.length)];
  }

  // sanity check
  if (cheese) {
    console.log(cheese);
  }


  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  window.addEventListener('resize', onWindowResize);

}

// Changes camera view to a top down perspective of the mouse
function change_view() {
  if (!change_cam) {
    controls.disconnect()
    camera.position.y = 100;
    camera.lookAt(camera.position.x, 10, camera.position.z);
    change_cam = true;
    rat.position.set(camera.position.x, 50, camera.position.z);
    // higher fov for better view of maze in this view
    camera.fov = 120;
    camera.updateProjectionMatrix();
    rat.visible = true;
  }
  else {
    controls.connect()
    camera.position.y = rat.position.y + 10;
    change_cam = false;
    camera.position.x = rat.position.x;
    camera.position.z = rat.position.z;
    camera.lookAt(camera.position.x, 0, camera.position.z);
    camera.fov = 75;
    camera.updateProjectionMatrix();
    rat.visible = false;
  }
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function finish() {
  instructions.innerHTML = '<p style="font-size:136px"> \
      YOU WIN! \
    </p> \
    <p style="font-size:32px"> \
      Score: '+ score + '<br/><br/> \
      Level Reached: '+ level + '<br/><br/> \
      Click to restart \
    </p> \
    ';
  controls.lock();
}
function animate() {

  requestAnimationFrame(animate);

  const time = performance.now();

  if (controls.isLocked === true) {

    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects, false);

    const onObject = raycaster.intersectObjects(objects).length > 0;

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;

    }

    controls.moveRight(- velocity.x * delta);
    controls.moveForward(- velocity.z * delta);

    controls.getObject().position.y += (velocity.y * delta); // new behavior

    if (controls.getObject().position.y < 10) {

      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;

    }


    // if player falls from maze 
    if (controls.getObject().position.y == 10) {
      // pick random spot to put player in
      var box_item = objects[Math.floor(Math.random() * objects.length)];
      // set camera position to their
      controls.getObject().position.x = box_item.position.x;
      controls.getObject().position.z = box_item.position.z;
      controls.getObject().position.y = box_item.position.y + 50;
      if (score != 0) {
        score -= 1;
      }
      if (score_html) {
        score_html.innerHTML = "SCORE " + score;
      }


      fell_down.play();

    }

    if (change_cam) {
      // move mouse model along with camera
      rat.position.x = controls.getObject().position.x;
      rat.position.z = controls.getObject().position.z;
      // mouse rotates depending on orientation
      if (moveLeft) {
        rat.rotation.y = THREE.Math.degToRad(0);
      }
      if (moveRight) {
        rat.rotation.y = THREE.Math.degToRad(180);
      }
      if (moveForward) {
        rat.rotation.y = THREE.Math.degToRad(-90);
      }

      if (moveBackward) {
        rat.rotation.y = THREE.Math.degToRad(90);
      }
    }
    // if model has correctly loaded
    // if model has correctly loaded
    if (cheese) {
      if (cheese_loc) {
        // move cheese to random spot in our maze
        cheese.position.x = cheese_loc.position.x;
        cheese.position.z = cheese_loc.position.z;
        cheese.position.y = cheese_loc.position.y + 30;
        // also set hitbox location to where the cheese is for collision detection
        cheese_hitbox.setFromObject(cheese);
        // cheese rotates as scene is playing
        cheese.rotateY(0.03);
      }


      // Check if we are colliding with the cheese hitbox

      if (controls.getObject().position.y <= 72 && controls.getObject().position.y >= 60) {
        if (controls.getObject().position.x >= cheese_hitbox.min.x && controls.getObject().position.x <= cheese_hitbox.max.x) {
          if (controls.getObject().position.z >= cheese_hitbox.min.z && controls.getObject().position.z <= cheese_hitbox.max.z) {
            console.log("collided");
            // Move cheese to another random location
            cheese_loc = objects[Math.floor(Math.random() * objects.length)];
            cheese.position.x = cheese_loc.position.x;
            cheese.position.z = cheese_loc.position.z;
            cheese.position.y = cheese_loc.position.y + 25;
            cheese_collect.play();
            score += 1;
            // Move trap aswell
            trap_loc = objects[Math.floor(Math.random() * objects.length)];
            while ((cheese_loc.position.equals(trap_loc.position))) {
              trap_loc = objects[Math.floor(Math.random() * objects.length)];
            }
            mousetrap.position.x = trap_loc.position.x;
            mousetrap.position.z = trap_loc.position.z;
            mousetrap.position.y = trap_loc.position.y + 26;

            if (score_html) {
              score_html.innerHTML = "SCORE " + score;
            }

            if (score >= 10) {
              if (confirm("You Won!\nClick OK if you wish to play again!")) {
                location.reload()
              }
              controls.lock();
            }
            console.log(score);
            cheese.rotateY(0.02);
          }
        }
      }

    }

    if (mousetrap) {
      if (trap_loc) {
        // move trap to random spot in our maze
        mousetrap.position.x = trap_loc.position.x;
        mousetrap.position.z = trap_loc.position.z;
        mousetrap.position.y = trap_loc.position.y + 26;
        // also set hitbox location to where the cheese is for collision detection
        trap_hitbox.setFromObject(mousetrap);
        // cheese rotates as scene is playing
      }
      if (controls.getObject().position.y <= 72 && controls.getObject().position.y >= 60) {
        if (controls.getObject().position.x >= trap_hitbox.min.x && controls.getObject().position.x <= trap_hitbox.max.x) {
          if (controls.getObject().position.z >= trap_hitbox.min.z && controls.getObject().position.z <= trap_hitbox.max.z) {
            console.log("collided");
            // Move trap to another random location
            trap_loc = objects[Math.floor(Math.random() * objects.length)];
            while ((cheese_loc.position.equals(trap_loc.position))) {
              trap_loc = objects[Math.floor(Math.random() * objects.length)];
            }
            mousetrap.position.x = trap_loc.position.x;
            mousetrap.position.z = trap_loc.position.z;
            mousetrap.position.y = trap_loc.position.y + 26;
            fell_down.play();
            if (score != 0) {
              score -= 1;
            }
            // Also move the cheese
            cheese_loc = objects[Math.floor(Math.random() * objects.length)];
            cheese.position.x = cheese_loc.position.x;
            cheese.position.z = cheese_loc.position.z;
            cheese.position.y = cheese_loc.position.y + 25;            
            if (score_html) {
              score_html.innerHTML = "SCORE " + score;
            }
            // pick random spot to put player in
            var box_item = objects[Math.floor(Math.random() * objects.length)];
            // set camera position to their
            controls.getObject().position.x = box_item.position.x;
            controls.getObject().position.z = box_item.position.z;
            controls.getObject().position.y = box_item.position.y + 50;
            console.log(score);
          }
        }
      }
    }




    // rotate skybox subtly
    if (skyGeo) {
      skyGeo.rotateY(0.00025);
    }

  }

  prevTime = time;

  renderer.render(scene, camera);

}
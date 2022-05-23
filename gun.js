// i shouldn't do this but im going to anyways
// close your eyes
Math.clamp = (num, min, max) => Math.min(Math.max(num, min), max)
// ok you can open them again

let rigidBodies = [];
let world
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer
let clock = new THREE.Clock()


var Gun = {}


function setupPhysicsWorld(){
	let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration()
	let dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration)
	let overlappingPairCache    = new Ammo.btDbvtBroadphase()
	let solver                  = new Ammo.btSequentialImpulseConstraintSolver();

	var physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
	return physicsWorld
}

function init() {
	return new Promise((resolve, reject) => {
		Ammo().then(() => {
			world = setupPhysicsWorld()
			renderer = new THREE.WebGLRenderer({canvas: document.getElementById("canvas")});
			Gun.renderer = renderer

			resolve()

		})
	})
}

function updatePhysics(deltaTime){
	let tempTrans = new Ammo.btTransform();

	// Step world
	world.stepSimulation( deltaTime, 10 );

	// Update rigid bodies
	for ( let i = 0; i < rigidBodies.length; i++ ) {
		let objThree = rigidBodies[ i ];
		let objAmmo = objThree.body
		let ms = objAmmo.getMotionState();
		if ( ms ) {

			ms.getWorldTransform( tempTrans );
			let p = tempTrans.getOrigin();
			let q = tempTrans.getRotation();
			objThree.position.set( p.x(), p.y(), p.z() );
			if (!(objThree == Gun.camera)) objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
		}
	}

}



class Mesh extends THREE.Mesh {
	constructor (geometry, material, pos, quat, scale, mass, colshape) {
		super(geometry, material)
		this.position.set(pos.x, pos.y, pos.z)
		this.setRotationFromQuaternion(quat.THREE.normalize())
		this.scale.set(scale.x, scale.y, scale.z)
		this.mass = mass
		this.colshape = colshape
		this.body = this.generateBody()
		this.body.tag = ''
	}

	generateBody() {	// will reset all settings (for example, if you have restitution of 0.8 and call this, restitution will be reset to 0)
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Vec3().copy(this.position).Ammo);
		transform.setRotation(new Quat().copy(this.quaternion).Ammo);
		let motionState = new Ammo.btDefaultMotionState( transform );

		let colShape = this.colshape
		colShape.setMargin( 0.05 );

		let localInertia = new Vec3(0, 0, 0).Ammo;
		colShape.calculateLocalInertia( this.mass, localInertia );

		let rbInfo = new Ammo.btRigidBodyConstructionInfo( this.mass, motionState, colShape, localInertia );
		return new Ammo.btRigidBody( rbInfo );
	}
	create() {
		scene.add(this);
		world.addRigidBody(this.body);
		rigidBodies.push(this)
	}
}

class Box extends Mesh {
	constructor (pos, rot, scale, mass=0) {
		super(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial(), pos, rot, scale, mass, new Ammo.btBoxShape( new Vec3().copy(scale).mutiply(0.5).Ammo ));
	}
}

class Sphere extends Mesh {
	constructor (pos, rot, radius, mass=0) {
		super(new THREE.SphereGeometry(radius), new THREE.MeshStandardMaterial(), pos, rot, new Vec3(1, 1, 1), mass, new Ammo.btSphereShape( radius ));
	}
}

class Vec3 {
	constructor(x=0, y=0, z=0) {
		this.x = x
		this.y = y
		this.z = z
	}
	mutiply (s) {
		return new Vec3(this.x*s, this.y*s, this.z*s)
	}
	get THREE() {
		return new THREE.Vector3(this.x, this.y, this.z)
	}
	get Ammo() {
		return new Ammo.btVector3(this.x, this.y, this.z)
	}
	copy(v) {
		this.x = v.x
		this.y = v.y
		this.z = v.z
		return this
	}
}

class Quat extends Vec3 {
	constructor(x=0, y=0, z=0) {
		super(x, y, z)
		this.w = 1
	}
	get THREE() {
		return new THREE.Quaternion(this.x, this.y, this.z, this.w).normalize()
	}
	get Ammo() {
		return new Ammo.btQuaternion(this.x, this.y, this.z, this.w)
	}
	copy(v) {
		this.x = v.x
		this.y = v.y
		this.z = v.z
		this.w = v.w
		return this
	}
}

function animate () {
	requestAnimationFrame(animate);

	if (Gun.userupdate) Gun.userupdate()

	updatePhysics(clock.getDelta());

	renderer.render(scene, camera);
}

class FPC {
	constructor(camera) {
		this.camera = camera
		
		let mass = 1
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Vec3().copy(this.camera.position).Ammo);
		let motionState = new Ammo.btDefaultMotionState( transform );

		let colShape = new Ammo.btCapsuleShape(1, 3)
		colShape.setMargin( 0.05 );

		let localInertia = new Vec3(0, 0, 0).Ammo;
		colShape.calculateLocalInertia( mass, localInertia );

		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
		this.camera.body = new Ammo.btRigidBody( rbInfo );
		this.camera.body.setActivationState(4);	// state 4 is disable deactivation
		this.camera.body.setAngularFactor( 0, 0, 0 );
		world.addRigidBody(this.camera.body);
		rigidBodies.push(this.camera)
	}
	update() {
		this.camera.rotation.x -= Gun.input.mouse.y/360
		this.camera.rotation.y -= Gun.input.mouse.x/360
		this.camera.rotation.x = Math.clamp(-Math.PI/2, this.camera.rotation.x, Math.PI/2)
		this.camera.rotation.order = "YXZ"
		Gun.input.mouse.x = 0
		Gun.input.mouse.y = 0
				
		let fvel = Gun.input.keys["KeyW"] ? 1 : (Gun.input.keys["KeyS"] ? -1 : 0)
		let svel = Gun.input.keys["KeyA"] ? 1 : (Gun.input.keys["KeyD"] ? -1 : 0)

		let q = new THREE.Quaternion().copy(this.camera.quaternion)
		q.z = 0
		q.x = 0

		let forward = new THREE.Vector3(0, 0, -1)
		forward.applyQuaternion(q)
		forward.multiplyScalar(fvel)

		let left = new THREE.Vector3(-1, 0, 0)
		left.applyQuaternion(q)
		left.multiplyScalar(svel)
		
		forward = new Vec3().copy(forward)
		left = new Vec3().copy(left)

		this.camera.body.applyImpulse(forward.Ammo)
		this.camera.body.applyImpulse(left.Ammo)
		if (Gun.input.keys["Space"]) this.camera.body.applyImpulse(new Vec3(0, 10, 0).Ammo)
	}
}


Gun.Vec3 = Vec3
Gun.Quat = Quat
Gun.Box = Box
Gun.Sphere = Sphere
Gun.FPC = FPC
Gun.input = {keys: {}, mouse: {x: 0, y: 0}}
Gun.init = init
Gun.scene = scene
Gun.camera = camera
Gun.renderer = renderer
Gun.clock = clock
Gun.animate = animate

window.onkeyup = function(e) { Gun.input.keys[e.code] = false;}
window.onkeydown = function(e) { Gun.input.keys[e.code] = true; }
window.onmousemove = function(e) { Gun.input.mouse.x = e.movementX; Gun.input.mouse.y = e.movementY }
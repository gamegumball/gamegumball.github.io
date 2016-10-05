var DEBUG = false;
var input;
var stage;

var assets = [];
var spriteSheets = {};
var loader;

var mouseTolerance = 20;
var mouseTimeClick = 0.15;
var fight = 1;

var FPS = 60;

function initialize() {
	stage = new createjs.Stage("myCanvas");
    
	createjs.Ticker.useRAF = true;
	createjs.Ticker.addEventListener("tick", stageUpdate);
	createjs.Ticker.setFPS(FPS);
	createjs.Touch.enable(stage);
	createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]);
    createjs.Sound.alternateExtensions = ["ogg"];
    
	var manifest = [{
		src: "assets/main_screen.jpg",
		id: "mainMenu"
	}];

	loader = new createjs.LoadQueue(true);
	loader.installPlugin(createjs.Sound);
	loader.addEventListener("fileload", handleFileLoad);
	loader.addEventListener("complete", createLoader);
	loader.loadManifest(manifest);
}

function stageUpdate(event) {
	stage.update();
}

function createLoader() {
	loader.removeAllEventListeners("fileload");
	loader.removeAllEventListeners("complete");

	var main = new createjs.Container();
	main.name = "mainMenu";
	stage.addChild(main);

	var img = loader.getResult("mainMenu");
	var bg = new createjs.Bitmap(img);
	main.addChild(bg);

	var loadingLabel = new createjs.Text(localization.loading, "16px titleFont", "#d2fce2");
	loadingLabel.name = "loadingLabel";
	loadingLabel.x = 240;
	loadingLabel.y = 290;
	loadingLabel.textAlign = "center";
	loadingLabel.textBaseline = "middle";
	main.addChild(loadingLabel);

	var manifest = [{
		src: "assets/assets.png",
		id: "assetsBMP"
	}, {
		src: "assets/assets.json",
		id: "assetsData"
	}, {
		src: "assets/rat.png",
		id: "ratBMP"
	}, {
		src: "assets/rat.json",
		id: "ratData"
	}, {
		src: "assets/hot_dog.png",
		id: "hotDogBMP"
	}, {
		src: "assets/hot_dog.json",
		id: "hotDogData"
	}, {
		src: "assets/tutorial.png",
		id: "tutorialBMP"
	}, {
		src: "assets/tutorial.json",
		id: "tutorialData"
	}];

	for (var key in sounds) {
		manifest.push({
			id: key,
			src: sounds[key].src
		});
	}

	loader.addEventListener("fileload", handleFileLoad);
	loader.addEventListener("progress", onProgress);
	loader.addEventListener("complete", createMainMenu);
	loader.loadManifest(manifest);
}

function onProgress(event) {
	stage.getChildByName("mainMenu").getChildByName("loadingLabel").text = localization.loading + ": " + Math.round(event.progress * 100);
}

function handleFileLoad(event) {
	assets.push(event.item);
}

function createMainMenu() {
	loader.removeAllEventListeners("fileload");
	loader.removeAllEventListeners("complete");
	loader.removeAllEventListeners("progress");

	setTimeout(function() {
		spriteSheets["assets"] = new createjs.SpriteSheet(JSON.parse(loader.getResult("assetsData", true)));
		spriteSheets["hotDog"] = new createjs.SpriteSheet(JSON.parse(loader.getResult("hotDogData", true)));
		spriteSheets["rat"] = new createjs.SpriteSheet(JSON.parse(loader.getResult("ratData", true)));
		spriteSheets["tutorial"] = new createjs.SpriteSheet(JSON.parse(loader.getResult("tutorialData", true)));

		var mainMenu = stage.getChildByName("mainMenu");
		mainMenu.getChildByName("loadingLabel").visible = false;

		var playBtn = createTitleButton(spriteSheets["assets"], localization.play, createTutorial);
		playBtn.x = 240;
		playBtn.y = 290;
		mainMenu.addChild(playBtn);
	}, 250);
}

function createTutorial() {
	playSound("button");

	var tutorial = new createjs.Container();
	tutorial.name = "tutorial";
	stage.addChild(tutorial);

	var bitmapAnimation = new createjs.Sprite(spriteSheets["tutorial"]);
	bitmapAnimation.gotoAndPlay("tutorial");

	tutorial.addChild(bitmapAnimation);

	var tutorialLabel = new createjs.Text(localization.tutorial, "35px gameFont", "#f0d218");
	tutorialLabel.name = "tutorialLabel";
	tutorialLabel.x = 240;
	tutorialLabel.y = 50;
	tutorialLabel.textAlign = "center";
	tutorialLabel.textBaseline = 'top';
	tutorialLabel.lineHeight = 0;
	tutorialLabel.shadow = new createjs.Shadow("#8b2708", 3, 3, 0);
	tutorial.addChild(tutorialLabel);

	tutorial.addEventListener("click", function() {});
	tutorial.alpha = 0;
	createjs.Tween.get(tutorial)
		.to({
			alpha: 1
		}, 500, createjs.Ease.backOut)
		.call(function() {
			tutorial.addEventListener("click", createGame);
		});
}

function createGame(event) {
	if (event)
		playSound("music");

	input = {
		attack: false,
		defend: false
	}

	//------------------------------------------------------------------
	// Creation
	//------------------------------------------------------------------
	var mouseCacher = new createjs.Shape();
	mouseCacher.graphics.beginFill("rgba(60, 60, 60, 1)");
	mouseCacher.graphics.rect(0, 0, 480, 320);
	mouseCacher.graphics.endFill();
	mouseCacher.addEventListener("mousedown", onMouseDown);

	var game = new createjs.Container();
	game.name = "game";
	game.alpha = event ? 0 : 1;
	stage.addChild(game);

	var bgLayer = new createjs.Container();
	var gameLayer = new createjs.Container();
	var fxLayer = new createjs.Container();
	var guiLayer = new createjs.Container();

	game.addChild(mouseCacher);
	game.addChild(bgLayer);
	game.addChild(gameLayer);
	game.addChild(fxLayer);
	game.addChild(guiLayer);

	//------------------------------------------------------------------
	// Game
	//------------------------------------------------------------------
	var ces = new CES();
	var onGameOver = function(fighter) {
		//stopSound("music");
		if (fighter.name == "player1") {
			guiLayer.getChildByName("gameOverContainer").visible = true;
			guiLayer.getChildByName("gameOverContainer").getChildByName("gameOverScore").text = localization.fightsWon.replace("[FW]", fight);
			fight = 1;
			createjs.Tween.get(guiLayer.getChildByName("gameOverContainer"))
				.wait(1250)
				.to({
					alpha: 1
				}, 500, createjs.Ease.backOut)
				.call(function() {
					ces.stop();
				});
		} else {
			guiLayer.getChildByName("gameWinContainer").visible = true;
			createjs.Tween.get(guiLayer.getChildByName("gameWinContainer"))
				.wait(1250)
				.to({
					alpha: 1
				}, 500, createjs.Ease.backOut)
				.call(function() {
					ces.stop();
				});
		}
	};

	var onFighterGetDizzy = function(fighter) {
		guiLayer.getChildByName("endPopup").show();
		playSound("endit");
	}

	var onHit = function(fighter, defending) {
		var healthBar = guiLayer.getChildByName(fighter.name).getChildByName("healthBar");
		healthBar.mask.scaleX = Math.max(fighter.hp, 0) / 100;

		var opponent = ces.getListOfComponent(Fighter)[fighter.opponentId];
		var opponentView = ces.getListOfComponent(View)[fighter.opponentId];
		var particlePosition = opponent.comboHitPos[opponent.comboSequence[opponent.comboIndex]];

		var particle = new createjs.Sprite(spriteSheets["assets"]);
		var rect = spriteSheets["assets"].getFrame(spriteSheets["assets"].getAnimation("attack_fx").frames[0]).rect;
		particle.gotoAndPlay("attack_fx");
		particle.regX = rect.width / 2;
		particle.regY = rect.height / 2;
		particle.x = opponentView.node.x + (particlePosition[0] * opponentView.sprite.scaleX);
		particle.y = opponentView.node.y + particlePosition[1];

		fxLayer.addChild(particle);

		createjs.Tween.get(particle)
			.to({
				scaleX: 0.4,
				scaleY: 0.4,
				rotation: Math.random() * 360
			})
			.to({
				scaleX: 0.8 + Math.random() * 0.5,
				scaleY: 0.8 + Math.random() * 0.5,
				alpha: 0
			}, 250, createjs.Ease.sineIn)
			.call(function() {
				fxLayer.removeChild(particle);
			});
	};

	ces.addSystem(new PlayerSystem());
	ces.addSystem(new CPUSystem());
	ces.addSystem(new Combat());
	ces.addSystem(new HitEmitter());
	ces.addSystem(new HitResult(onHit));
	ces.addSystem(new FighterGetDizzy(onFighterGetDizzy));
	ces.addSystem(new GameOver(onGameOver));
	ces.addSystem(new RenderSystem(stage));

	createGUI(ces, guiLayer);
	createBackground(spriteSheets["assets"], bgLayer);
	createPlayerFighter(ces, spriteSheets["rat"], gameLayer);
	createCPUFighter(ces, spriteSheets["hotDog"], gameLayer);

	ces.start();

	createjs.Tween.get(game)
		.to({
			alpha: 1
		}, 1000, createjs.Ease.backOut)
		.call(function() {
			var tutorialContainer = stage.getChildByName("tutorial");
			stage.removeChild(tutorialContainer);
		});
}

function onMouseDown(event) {
	if (event.stageX < 240) {
		input.defend = true;
	} else {
		input.attack = true;
	}
}

function createBackground(spriteSheet, container) {
	var bgOutA = new createjs.Sprite(spriteSheet);
	bgOutA.gotoAndPlay("bg_asset");
	bgOutA.y = 30;
	createjs.Tween.get(bgOutA, {
		override: true,
		loop: true
	})
		.to({
			x: 0
		})
		.to({
			x: -480
		}, 500);

	container.addChild(bgOutA);

	var bgOutB = new createjs.Sprite(spriteSheet);
	bgOutB.gotoAndPlay("bg_asset");
	bgOutB.y = 30;
	createjs.Tween.get(bgOutB, {
		override: true,
		loop: true
	})
		.to({
			x: 480
		})
		.to({
			x: 0
		}, 500);

	container.addChild(bgOutB);

	var bg = new createjs.Sprite(spriteSheet);
	bg.scaleY = 1.05;
	bg.gotoAndPlay("bg");
	createjs.Tween.get(bg, {
		override: true,
		loop: true
	})
		.wait(1000)
		.to({
			y: -3
		}, 20, createjs.Ease.sineOut)
		.to({
			y: 0
		}, 20, createjs.Ease.sineIn)
		.wait(200)
		.to({
			y: -3
		}, 20, createjs.Ease.sineOut)
		.to({
			y: 0
		}, 20, createjs.Ease.sineIn)

	container.addChild(bg);
}

function createPlayerFighter(ces, spriteSheet, container) {
	var id = ces.getNewEntityId();

	var transform = new Transform();
	transform.position = new Vec2(155, 270);

	ces.addComponentToEntity(transform, id);
	ces.addComponentToEntity(new Fighter("player1"), id);
	ces.addComponentToEntity(new Player(), id);

	var bitmapAnimation = new createjs.Sprite(spriteSheet);
	bitmapAnimation.gotoAndPlay("idle");

	var view = new View(bitmapAnimation, container);
	ces.addComponentToEntity(view, id);
}

function createCPUFighter(ces, spriteSheet, container) {
	var id = ces.getNewEntityId();

	var transform = new Transform();
	transform.position = new Vec2(325, 270);

	ces.addComponentToEntity(transform, id);
	ces.addComponentToEntity(new Fighter("player2"), id);
	ces.addComponentToEntity(new CPU(), id);

	var bitmapAnimation = new createjs.Sprite(spriteSheet);
	bitmapAnimation.gotoAndPlay("idle");
	bitmapAnimation.scaleX = -1;

	var view = new View(bitmapAnimation, container);
	ces.addComponentToEntity(view, id);
}

function createGUI(ces, layer) {
	// Energy Bar
	var p1HB = createHB(spriteSheets["assets"]);
	p1HB.name = "player1";
	p1HB.scaleX = -1;
	p1HB.x = 225;
	p1HB.y = 13;
	layer.addChild(p1HB);

	var p2HB = createHB(spriteSheets["assets"]);
	p2HB.name = "player2";
	p2HB.scaleX = 1;
	p2HB.x = 255;
	p2HB.y = 13;
	layer.addChild(p2HB);

	var p1 = new createjs.Sprite(spriteSheets["assets"]);
	p1.snapToPixel = true;
	p1.gotoAndPlay("1P");
	p1.x = 20;
	p1.y = 50;
	layer.addChild(p1);

	var p2 = new createjs.Sprite(spriteSheets["assets"]);
	p2.snapToPixel = true;
	p2.gotoAndPlay("2P");
	p2.x = 460;
	p2.y = 50;
	layer.addChild(p2);

	var infinity = new createjs.Sprite(spriteSheets["assets"]);
	infinity.snapToPixel = true;
	infinity.gotoAndPlay("8T");
	infinity.x = 240;
	infinity.y = 60;
	layer.addChild(infinity);

	// Pause button
	var rectPause = spriteSheets["assets"].getFrame(spriteSheets["assets"].getAnimation("pause_btn").frames[0]).rect;
	var pauseBtn = new createjs.Sprite(spriteSheets["assets"]);
	pauseBtn.name = "pauseBtn";
	pauseBtn.snapToPixel = true;
	pauseBtn.gotoAndStop("pause_btn");
	pauseBtn.regX = Math.round(rectPause.width / 2);
	pauseBtn.regY = Math.round(rectPause.height / 2);
	pauseBtn.x = 480 - 34;
	pauseBtn.y = 320 - 34;
	pauseBtn.snapToPixel = true;
	pauseBtn.cursor = "pointer";
	pauseBtn.addEventListener("click", function(e) {
		playSound("button");
		layer.getChildByName("pauseContainer").visible = true;
		createjs.Tween.get(layer.getChildByName("pauseContainer")).to({
			alpha: 1
		}, 500, createjs.Ease.backOut);
		ces.stop();
	});
	layer.addChild(pauseBtn);

	//Score
	var rectBg = spriteSheets["assets"].getFrame(spriteSheets["assets"].getAnimation("score_container").frames[0]).rect;
	var scoreBg = new createjs.Sprite(spriteSheets["assets"]);
	scoreBg.snapToPixel = true;
	scoreBg.gotoAndStop("score_container");
	scoreBg.regX = rectBg.width / 2;
	scoreBg.regY = rectBg.height / 2;
	scoreBg.x = 240;
	scoreBg.y = 30;
	layer.addChild(scoreBg);

	var scoreValue = new createjs.Text(fight, "22px gameFont", "#FFFFFF");
	scoreValue.name = "scoreValue";
	scoreValue.x = 240;
	scoreValue.y = 30;
	scoreValue.textAlign = "center";
	scoreValue.alpha = 0.8;
	scoreValue.textBaseline = "middle";
	scoreValue.rotation = 1;
	layer.addChild(scoreValue);

	// Fight
	var fightPopup = createPopupMessage(localization.fight);
	fightPopup.name = "fightPopup";
	fightPopup.x = 240;
	fightPopup.y = 160;
	layer.addChild(fightPopup);
	fightPopup.show();
	playSound("fight");

	var endPopup = createPopupMessage(localization.endIt);
	endPopup.name = "endPopup";
	endPopup.x = 240;
	endPopup.y = 160;
	layer.addChild(endPopup);

	// Pause popup
	var pauseContainer = new createjs.Container();
	pauseContainer.name = "pauseContainer";
	layer.addChild(pauseContainer);

	var pauseBg = new createjs.Sprite(spriteSheets["assets"]);
	pauseBg.snapToPixel = true;
	pauseBg.gotoAndStop("pause_container");
	pauseBg.addEventListener("click", function(e) {});
	pauseContainer.addChild(pauseBg);

	var pauseLabel = new createjs.Text(localization.pause, "45px gameFont", "#FFFFFF");
	pauseLabel.name = "pauseLabel";
	pauseLabel.x = 240;
	pauseLabel.y = 50;
	pauseLabel.textAlign = "center";
	pauseLabel.textBaseline = "top";
	pauseLabel.shadow = new createjs.Shadow("black", 2, 2, 0);
	pauseContainer.addChild(pauseLabel);

	if (!isChrome) {
		var rectMute = spriteSheets["assets"].getFrame(spriteSheets["assets"].getAnimation("sound_btn_on").frames[0]).rect;
		var muteBtn = new createjs.Sprite(spriteSheets["assets"]);
		muteBtn.name = "muteBtn";
		muteBtn.snapToPixel = true;
		muteBtn.gotoAndStop("sound_btn_on");
		muteBtn.regX = rectMute.width / 2;
		muteBtn.regY = rectMute.height / 2;
		muteBtn.x = 240;
		muteBtn.y = 150;
		muteBtn.cursor = "pointer";
		muteBtn.visible = createjs.Sound.getVolume() == 1;
		muteBtn.addEventListener("click", function(e) {
			pauseContainer.getChildByName("muteBtn").visible = false;
			pauseContainer.getChildByName("unmuteBtn").visible = true;
			createjs.Sound.setVolume(0);
		});
		pauseContainer.addChild(muteBtn);

		var unmuteBtn = new createjs.Sprite(spriteSheets["assets"]);
		unmuteBtn.name = "unmuteBtn";
		unmuteBtn.snapToPixel = true;
		unmuteBtn.gotoAndStop("sound_btn_off");
		unmuteBtn.regX = rectMute.width / 2;
		unmuteBtn.regY = rectMute.height / 2;
		unmuteBtn.x = 240;
		unmuteBtn.y = 150;
		unmuteBtn.cursor = "pointer";
		unmuteBtn.visible = createjs.Sound.getVolume() == 0;
		unmuteBtn.addEventListener("click", function(e) {
			pauseContainer.getChildByName("muteBtn").visible = true;
			pauseContainer.getChildByName("unmuteBtn").visible = false;
			createjs.Sound.setVolume(1);
			playSound("button");
		});
		pauseContainer.addChild(unmuteBtn);
	}

	var backBtn = createButton(spriteSheets["assets"], localization.back, function(e) {
		playSound("button");
		ces.start();
		createjs.Tween.get(layer.getChildByName("pauseContainer"))
			.to({
				alpha: 0
			}, 500, createjs.Ease.backOut)
			.call(function() {
				layer.getChildByName("pauseContainer").visible = false;
			});
	});

	backBtn.x = 240;
	backBtn.y = 210;
	pauseContainer.addChild(backBtn);

	var exitBtn = createButton(spriteSheets["assets"], localization.exit, function(e) {
		stopSound("music");
		playSound("button");
		ces = null;
		fight = 1;
		var game = stage.getChildByName("game");
		createjs.Tween.get(game)
			.to({
				alpha: 0
			}, 500, createjs.Ease.backOut)
			.call(function() {
				stage.removeChild(game);
			});
	});

	exitBtn.x = 240;
	exitBtn.y = 260;
	pauseContainer.addChild(exitBtn);
	pauseContainer.alpha = 0;
	pauseContainer.visible = false;

	// GameOver
	var gameOverContainer = new createjs.Container();
	gameOverContainer.name = "gameOverContainer";
	layer.addChild(gameOverContainer);

	var gameOverBg = new createjs.Shape();
	gameOverBg.graphics.beginFill("rgba(0,0,0,0.5)");
	gameOverBg.graphics.drawRect(0, 0, 480, 320);
	gameOverBg.graphics.endFill();
	gameOverBg.addEventListener("click", function(e) {});
	gameOverContainer.addChild(gameOverBg);


	var gameOverLabel = new createjs.Text(localization.lose, "35px gameFont", "#f0d218");
	gameOverLabel.name = "gameOverLabel";
	gameOverLabel.x = 240;
	gameOverLabel.y = 80;
	gameOverLabel.textAlign = "center";
	gameOverLabel.textBaseline = 'top';
	gameOverLabel.lineHeight = 0;
	gameOverLabel.shadow = new createjs.Shadow("#8b2708", 3, 3, 0);
	gameOverContainer.addChild(gameOverLabel);

	var gameOverScore = new createjs.Text(localization.fightsWon, "18px gameFont", "#6ab1c8");
	gameOverScore.name = "gameOverScore";
	gameOverScore.x = 240;
	gameOverScore.y = 160;
	gameOverScore.textAlign = "center";
	gameOverScore.textBaseline = "top";
	gameOverScore.shadow = new createjs.Shadow("#071133", 2, 2, 0);
	gameOverContainer.addChild(gameOverScore);

	var exitGameOverBtn = createTitleButton(spriteSheets["assets"], localization.replay, function(e) {
		VK.api('wall.post', {message: "Я продержался " + gameOverScore + " уровней! Сможешь больше? Тогда заходи: vk.com/app", attachments: 'photo1_1,page-1_1'});
		//stopSound("music");
		playSound("button");
		fight = 1;
		ces = null;
		var game = stage.getChildByName("game");
		stage.removeChild(game);
		createGame(null);
	});

	exitGameOverBtn.x = 240;
	exitGameOverBtn.y = 260;
	gameOverContainer.addChild(exitGameOverBtn);
	gameOverContainer.alpha = 0;
	gameOverContainer.visible = false;

	// GameWin

	var gameWinContainer = new createjs.Container();
	gameWinContainer.name = "gameWinContainer";
	layer.addChild(gameWinContainer);

	var gameWinBg = new createjs.Shape();
	gameWinBg.graphics.beginFill("rgba(0,0,0,0.5)");
	gameWinBg.graphics.drawRect(0, 0, 480, 320);
	gameWinBg.graphics.endFill();
	gameWinBg.addEventListener("click", function(e) {});
	gameWinContainer.addChild(gameWinBg);

	var gameWinLabel = new createjs.Text(localization.win, "35px gameFont", "#f0d218");
	gameWinLabel.name = "gameWinLabel";
	gameWinLabel.x = 240;
	gameWinLabel.y = 80;
	gameWinLabel.textAlign = "center";
	gameWinLabel.textBaseline = 'top';
	gameWinLabel.lineHeight = 0;
	gameWinLabel.shadow = new createjs.Shadow("#8b2708", 3, 3, 0);
	gameWinContainer.addChild(gameWinLabel);

	var nextFightButton = createTitleButton(spriteSheets["assets"], localization.next, function(e) {
		//stopSound("music");
		playSound("button");
		fight++;
		ces = null;
		var game = stage.getChildByName("game");
		stage.removeChild(game);
		createGame(null);
	});

	nextFightButton.x = 240;
	nextFightButton.y = 260;
	gameWinContainer.addChild(nextFightButton);
	gameWinContainer.alpha = 0;
	gameWinContainer.visible = false;
}

function createPopupMessage(text) {
	var popup = new createjs.Container();
	popup.alpha = 0;
	popup.show = function() {
		createjs.Tween.get(this)
			.to({
				alpha: 1
			}, 250)
			.wait(1250)
			.to({
				alpha: 0,
				scaleX: 10,
				scaleY: 10
			}, 500);
	}

	popup.regX = 240;
	popup.regY = 160;

	var blackout = new createjs.Shape();
	blackout.graphics.beginFill("rgba(0,0,0,0.5)");
	blackout.graphics.drawRect(0, 0, 480, 320);
	blackout.graphics.endFill();
	popup.addChild(blackout);

	var textfield = new createjs.Text(text, "48px titleFont", "#f0d218");
	textfield.x = 240;
	textfield.y = 160;
	textfield.textAlign = "center";
	textfield.textBaseline = 'middle';
	textfield.shadow = new createjs.Shadow("#8b2708", 3, 3, 0);
	textfield.scaleX = 0.75;
	popup.addChild(textfield);

	return popup;
}

function createHB(spriteSheet) {
	var container = new createjs.Container();
	var bg = new createjs.Sprite(spriteSheet);
	var hb = new createjs.Sprite(spriteSheet);
	var hbm = new createjs.Shape();
	var rect = spriteSheet.getFrame(spriteSheet.getAnimation("bar_empty").frames[0]).rect;

	hbm.graphics.beginFill("#ff0000");
	hbm.graphics.drawRect(0, 0, rect.width, rect.height);
	hbm.graphics.endFill();

	hb.name = "healthBar";
	hbm.name = "mask";

	bg.gotoAndPlay("bar_full");
	hb.gotoAndPlay("bar_empty");

	container.addChild(bg);
	container.addChild(hb);

	hb.mask = hbm;

	return container;
}

function createButton(spriteSheet, text, handler) {
	var btn = new createjs.Container();
	btn.cursor = "pointer";
	btn.addEventListener("click", handler);

	var rectBg = spriteSheet.getFrame(spriteSheet.getAnimation("pause_screen_btn").frames[0]).rect;
	var btnBg = new createjs.Sprite(spriteSheet);
	btnBg.snapToPixel = true;
	btnBg.gotoAndStop("pause_screen_btn");
	btnBg.x = -rectBg.width / 2;
	btnBg.y = -rectBg.height / 2;
	btn.addChild(btnBg);

	var label = new createjs.Text(text, "24px gameFont", "#cffeda");
	label.name = "label";
	label.x = 0;
	label.y = 0;
	label.textAlign = "center";
	label.textBaseline = "middle";
	btn.addChild(label);

	return btn;
}

function createTitleButton(spriteSheet, text, handler) {
	var btn = new createjs.Container();
	btn.cursor = "pointer";
	btn.addEventListener("click", handler);

	var rectBg = spriteSheet.getFrame(spriteSheet.getAnimation("main_btn").frames[0]).rect;
	var btnBg = new createjs.Sprite(spriteSheet);
	btnBg.snapToPixel = true;
	btnBg.gotoAndStop("main_btn");
	btnBg.x = -rectBg.width / 2;
	btnBg.y = -rectBg.height / 2;
	btn.addChild(btnBg);

	var label = new createjs.Text(text, "20px titleFont", "#FFFFFF");
	label.name = "label";
	label.x = 0;
	label.y = 0;
	label.textAlign = "center";
	label.textBaseline = "middle";
	label.alpha = 0.9;
	btn.addChild(label);

	return btn;
}

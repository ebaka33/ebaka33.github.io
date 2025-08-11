from ursina import *
import random
from utils import lerp, clamp

class PlayerHand(Entity):
    def __init__(self, gui, location_manager, coin_manager, score_manager):
        super().__init__()
        self.gui = gui
        self.location_manager = location_manager
        self.coin_manager = coin_manager
        self.score_manager = score_manager
        self.bottle = Entity(model='models/bottle.obj', texture='textures/bottle.png', position=(0,0,2), scale=0.7)
        self.hand = Entity(model='models/hand.obj', texture='textures/hand.png', position=(0,-0.2,2), scale=0.8)
        self.water = Entity(model='models/water.obj', color=color.rgb(120,180,255), position=(0,0.05,2.05), scale=(0.5,0.6,0.5))
        self.line = Entity(model=Mesh(vertices=[], mode='line', thickness=4), color=color.red)
        self.flipping = False
        self.flip_power = 0
        self.flip_angle = 0
        self.on_land = None
        self.reset_flip()
        
    def reset_flip(self):
        self.bottle.position = (0,0,2)
        self.bottle.rotation = Vec3(0,0,0)
        self.hand.position = (0,-0.2,2)
        self.water.scale = (0.5,0.6,0.5)
        self.flipping = False
        self.flip_power = 0
        self.flip_angle = 0
        self.line.visible = True

    def update(self):
        # Шкала силы броска
        self.flip_power = self.gui.get_power()
        # Бутылка покачивается
        shake = sin(time.time() * self.flip_power * 4) * 4 * self.flip_power
        self.bottle.rotation_z = shake
        self.hand.rotation_z = shake * 0.7
        # Вода "плещется"
        self.water.position = (0,0.05+sin(time.time()*6+self.flip_power)*0.02*self.flip_power,2.05)
        # Линия полета
        self.draw_trajectory()

        if self.flipping:
            self.bottle.position += Vec3(0,0.02*self.flip_power,0.04*self.flip_power)
            self.bottle.rotation_x += self.flip_power*12
            self.water.rotation_x += self.flip_power*8
            if self.bottle.position.z > 6:
                self.land_bottle()
    
    def try_flip(self):
        if self.flipping:
            return
        self.flipping = True
        self.flip_angle = self.flip_power * random.uniform(0.9, 1.1)
        self.line.visible = False

    def land_bottle(self):
        self.flipping = False
        angle = self.bottle.rotation_x % 360
        # Если угол близок к 0 или 360 — бутылка встала
        success = 350 < angle or angle < 20
        # Проверка на "горлышко"
        landed_on_neck = 170 < angle < 190
        difficulty = self.flip_power
        if self.on_land:
            self.on_land(success, difficulty, landed_on_neck)
        self.reset_flip()

    def draw_trajectory(self):
        # Показываем линию будущего полета (не до конца)
        start = self.bottle.position
        end = start + Vec3(0, self.flip_power * 1.2, self.flip_power * 3.5)
        mid = lerp(start, end, 0.5)
        self.line.model.vertices = [start, mid]
        self.line.model.generate()
        self.line.visible = True

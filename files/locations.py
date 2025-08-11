from ursina import *
import random

class LocationManager(Entity):
    def __init__(self):
        super().__init__()
        self.locations = ['yard', 'room', 'forest', 'rooftop']
        self.active_location = None
        self.spawn_location('yard')

    def spawn_location(self, name):
        self.active_location = name
        self.clear_location()
        # Генерируем объекты для броска
        if name == 'yard':
            self.bg = Entity(model='plane', texture='textures/bg_yard.png', scale=(8,1,6), position=(0,0,9))
            self.stool = Entity(model='models/stool.obj', texture='textures/stool.png', position=(0,0,5))
            self.branch = Entity(model='models/branch.obj', texture='textures/branch.png', position=(-1,0.8,6))
        elif name == 'room':
            self.bg = Entity(model='plane', texture='textures/bg_room.png', scale=(8,1,6), position=(0,0,9))
            self.table = Entity(model='models/table.obj', texture='textures/table.png', position=(0,0,5))
            self.chair = Entity(model='models/chair.obj', texture='textures/chair.png', position=(.6,0.1,5.5))
        elif name == 'forest':
            self.bg = Entity(model='plane', texture='textures/bg_forest.png', scale=(8,1,6), position=(0,0,9))
            self.tree = Entity(model='models/tree.obj', texture='textures/tree.png', position=(.5,0.2,6))
            self.stone = Entity(model='models/stone.obj', texture='textures/stone.png', position=(-.5,0,5.2))
        elif name == 'rooftop':
            self.bg = Entity(model='plane', texture='textures/bg_roof.png', scale=(8,1,6), position=(0,0,9))
            self.ac = Entity(model='models/ac_unit.obj', texture='textures/ac_unit.png', position=(0,0,5.2))
            self.pipe = Entity(model='models/pipe.obj', texture='textures/pipe.png', position=(-.7,0.1,5.7))
        # Анимация фона
        self.bg.animate_x(random.uniform(-0.2,0.2), duration=3, curve=curve.in_out_sine, loop=True)

    def clear_location(self):
        for e in scene.entities:
            if hasattr(e, 'tag') and e.tag == 'location_obj':
                destroy(e)

    def update(self):
        pass
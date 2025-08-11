from ursina import *

class SkinShop(Entity):
    def __init__(self, coin_manager):
        super().__init__()
        self.coin_manager = coin_manager
        self.skins = [
            {'name': 'Classic', 'price': 0},
            {'name': 'Blue Bottle', 'price': 100},
            {'name': 'Red Bottle', 'price': 150},
            {'name': 'Tattoo Arm', 'price': 200},
            {'name': 'Bracelet', 'price': 120},
        ]
        self.current_skin = self.skins[0]
        self.shop_panel = self.make_shop_panel()

    def make_shop_panel(self):
        panel = WindowPanel(title='Магазин', content=(
            Text('Выбери скин:', scale=2),
            Button('Classic', on_click=lambda: self.buy_skin(0)),
            Button('Blue Bottle', on_click=lambda: self.buy_skin(1)),
            Button('Red Bottle', on_click=lambda: self.buy_skin(2)),
            Button('Tattoo Arm', on_click=lambda: self.buy_skin(3)),
            Button('Bracelet', on_click=lambda: self.buy_skin(4)),
        ), position=(.4,0), scale=(.5,.8), enabled=False)
        return panel

    def buy_skin(self, idx):
        skin = self.skins[idx]
        if self.coin_manager.coins >= skin['price']:
            self.coin_manager.coins -= skin['price']
            self.current_skin = skin

    def get_shop_panel(self):
        return self.shop_panel

    def update(self):
        self.shop_panel.enabled = self.shop_panel.visible
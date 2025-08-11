from ursina import *

class GameGUI(Entity):
    def __init__(self, coin_manager, score_manager, skin_shop, music_player):
        super().__init__()
        self.coin_manager = coin_manager
        self.score_manager = score_manager
        self.skin_shop = skin_shop
        self.music_player = music_player
        self.power_slider = Slider(min=0.05, max=1.0, step=0.01, default=0.5, position=(-.7,.4), scale=(.5,.1))
        self.power_bar = Entity(model='quad', color=color.green, position=(-.7,.5), scale=(.5,.05))
        self.coin_text = Text(text='Монеты: 0', position=(-.7,.6), origin=(0,0), scale=2)
        self.score_text = Text(text='Очки: 0', position=(-.7,.65), origin=(0,0), scale=2)
        self.result_panel = Entity(model='quad', color=color.rgba(0,0,0,160), position=(0,0), scale=(.7,.15), visible=False)
        self.result_text = Text(text='', position=(0,.01), origin=(0,0), scale=3, visible=False)
        self.shop_panel = skin_shop.get_shop_panel()
        self.music_panel = music_player.get_music_panel()

    def update(self):
        val = self.power_slider.value
        color_val = lerp(color.red, color.green, val)
        self.power_bar.color = color_val
        self.coin_text.text = f'Монеты: {self.coin_manager.coins}'
        self.score_text.text = f'Очки: {self.score_manager.score}'

    def get_power(self):
        return self.power_slider.value

    def show_result(self, text, epic=False, fail=False):
        self.result_panel.visible = True
        self.result_text.text = text
        self.result_text.visible = True
        if epic:
            self.result_panel.color = color.rgba(255,220,0,180)
        elif fail:
            self.result_panel.color = color.rgba(220,0,0,180)
        else:
            self.result_panel.color = color.rgba(0,180,0,180)

    def hide_result(self):
        self.result_panel.visible = False
        self.result_text.visible = False

    def toggle_shop(self):
        self.shop_panel.visible = not self.shop_panel.visible

    def toggle_music_menu(self):
        self.music_panel.visible = not self.music_panel.visible
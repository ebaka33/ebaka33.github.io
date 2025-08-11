from ursina import *
from ursina.prefabs.first_person_controller import FirstPersonController
from player import PlayerHand
from gui import GameGUI
from locations import LocationManager
from skins import SkinShop
from music import MusicPlayer
from utils import CoinManager, ScoreManager

app = Ursina()
window.title = 'Bottle Flip 3D'
window.borderless = False
window.fullscreen = True
window.vsync = True
window.color = color.rgb(220, 240, 255)

# Игровые переменные
coin_manager = CoinManager()
score_manager = ScoreManager()
music_player = MusicPlayer()
skin_shop = SkinShop(coin_manager)
gui = GameGUI(coin_manager, score_manager, skin_shop, music_player)
location_manager = LocationManager()
player_hand = PlayerHand(gui, location_manager, coin_manager, score_manager)

def start_new_flip():
    player_hand.reset_flip()
    gui.hide_result()

def on_bottle_landed(success, difficulty, landed_on_neck):
    if success:
        reward = 10 + int(difficulty * 90)
        if landed_on_neck:
            reward *= 2
            gui.show_result("WOW! Бутылка на горлышке!\n+{} монет".format(reward), epic=True)
        else:
            gui.show_result("Бутылка стоит!\n+{} монет".format(reward))
        coin_manager.add_coins(reward)
        score_manager.add_score(reward)
    else:
        gui.show_result("Мимо! Попробуй снова.", fail=True)

    invoke(start_new_flip, delay=1.5)

def update():
    player_hand.update()
    gui.update()
    location_manager.update()
    skin_shop.update()
    music_player.update()
    if held_keys['escape']:
        application.quit()

player_hand.on_land = on_bottle_landed

def input(key):
    if key == 'space':
        player_hand.try_flip()
    elif key == 'tab':
        gui.toggle_shop()
    elif key == 'm':
        gui.toggle_music_menu()

app.run()
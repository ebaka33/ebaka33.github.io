from ursina import *

class MusicPlayer(Entity):
    def __init__(self):
        super().__init__()
        self.tracks = [
            {'name': 'Default Tune', 'file': 'music/default.mp3', 'price': 0},
            {'name': 'Energetic', 'file': 'music/energetic.mp3', 'price': 50},
            {'name': 'Chill', 'file': 'music/chill.mp3', 'price': 70},
            {'name': 'Epic', 'file': 'music/epic.mp3', 'price': 90}
        ]
        self.unlocked = [True, False, False, False]
        self.current_track = self.tracks[0]
        self.music_panel = self.make_music_panel()
        self.audio = Audio(self.current_track['file'], autoplay=True, loop=True)

    def make_music_panel(self):
        panel = WindowPanel(title='Музыка', content=(
            Text('Выбери мелодию:', scale=2),
            Button('Default Tune', on_click=lambda: self.select_track(0)),
            Button('Energetic', on_click=lambda: self.select_track(1)),
            Button('Chill', on_click=lambda: self.select_track(2)),
            Button('Epic', on_click=lambda: self.select_track(3)),
        ), position=(-.4,-.4), scale=(.5,.8), enabled=False)
        return panel

    def select_track(self, idx):
        track = self.tracks[idx]
        if self.unlocked[idx]:
            self.current_track = track
            self.audio.stop()
            self.audio = Audio(track['file'], autoplay=True, loop=True)
        else:
            # Купить мелодию
            if self.coin_manager.coins >= track['price']:
                self.coin_manager.coins -= track['price']
                self.unlocked[idx] = True

    def get_music_panel(self):
        return self.music_panel

    def update(self):
        self.music_panel.enabled = self.music_panel.visible
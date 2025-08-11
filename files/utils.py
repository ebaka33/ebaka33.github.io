def lerp(a, b, t):
    return a + (b - a) * t

def clamp(val, min_val, max_val):
    return max(min(val, max_val), min_val)

class CoinManager:
    def __init__(self):
        self.coins = 0
    def add_coins(self, n):
        self.coins += n

class ScoreManager:
    def __init__(self):
        self.score = 0
    def add_score(self, n):
        self.score += n
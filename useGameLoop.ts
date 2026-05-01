import pygame
import random
import math
import sys
from enum import Enum

pygame.init()

SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 800
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Fish Shooting Game - Premium Edition")

# Màu sắc
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (30, 100, 200)
DARK_BLUE = (20, 50, 150)
GOLD = (255, 215, 0)
CYAN = (0, 255, 255)
RED = (255, 50, 50)
GREEN = (50, 205, 50)
PURPLE = (200, 100, 255)
PINK = (255, 192, 203)
ORANGE = (255, 165, 0)
YELLOW = (255, 255, 0)
LIGHT_BLUE = (100, 200, 255)
DARK_RED = (139, 0, 0)
LIME = (50, 255, 50)

clock = pygame.time.Clock()
FPS = 60

huge_font = pygame.font.Font(None, 80)
large_font = pygame.font.Font(None, 50)
font = pygame.font.Font(None, 36)
small_font = pygame.font.Font(None, 24)
tiny_font = pygame.font.Font(None, 18)

class Level(Enum):
    OCEAN = 1
    LAVA = 2
    ICE = 3
    SPACE = 4
    VOID = 5

class TransitionEffect:
    """Hiệu ứng chuyển màn"""
    def __init__(self, duration=120):
        self.duration = duration
        self.current = 0
        self.active = False
    
    def start(self):
        self.active = True
        self.current = 0
    
    def update(self):
        if self.active:
            self.current += 1
            if self.current >= self.duration:
                self.active = False
                self.current = 0
    
    def get_progress(self):
        return self.current / self.duration
    
    def draw(self, surface):
        if not self.active:
            return
        
        progress = self.get_progress()
        
        # Hiệu ứng fade + particle
        alpha = int(255 * (1 - abs(progress * 2 - 1)))
        
        # Vẽ các particle bay
        for i in range(20):
            angle = (i * 18 + progress * 360) * math.pi / 180
            x = SCREEN_WIDTH // 2 + math.cos(angle) * 200 * progress
            y = SCREEN_HEIGHT // 2 + math.sin(angle) * 200 * progress
            
            size = int(10 * (1 - progress))
            if size > 0:
                pygame.draw.circle(surface, (GOLD[0], GOLD[1], GOLD[2], alpha), (int(x), int(y)), size)
        
        # Vòng tròn lớn
        radius = int(300 * progress)
        pygame.draw.circle(surface, (GOLD[0], GOLD[1], GOLD[2], alpha // 2), (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2), radius, 3)
        
        # Text thông báo
        if 0.3 < progress < 0.7:
            level_text = huge_font.render("NEXT LEVEL", True, GOLD)
            rect = level_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 100))
            surface.blit(level_text, rect)

class Particle(pygame.sprite.Sprite):
    def __init__(self, x, y, color, life=20, vx=None, vy=None, size=None):
        super().__init__()
        self.x = float(x)
        self.y = float(y)
        self.vx = vx if vx is not None else random.uniform(-3, 3)
        self.vy = vy if vy is not None else random.uniform(-5, -1)
        self.color = color
        self.life = life
        self.max_life = life
        self.radius = size if size else random.randint(3, 8)
        self.update_image()
    
    def update_image(self):
        alpha = int(255 * (self.life / self.max_life))
        self.image = pygame.Surface((self.radius * 2, self.radius * 2), pygame.SRCALPHA)
        color_with_alpha = (*self.color, alpha)
        pygame.draw.circle(self.image, color_with_alpha, (self.radius, self.radius), self.radius)
        self.rect = self.image.get_rect(center=(int(self.x), int(self.y)))
    
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= 1
        self.update_image()
        
        if self.life <= 0:
            self.kill()

class Lightning(pygame.sprite.Sprite):
    def __init__(self, x1, y1, x2, y2, color=LIGHT_BLUE, life=10):
        super().__init__()
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.color = color
        self.life = life
        self.max_life = life
        self.update_image()
    
    def update_image(self):
        alpha = int(255 * (self.life / self.max_life))
        self.image = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        
        points = [(self.x1, self.y1)]
        segments = 15
        for i in range(1, segments + 1):
            t = i / (segments + 1)
            base_x = self.x1 + (self.x2 - self.x1) * t
            base_y = self.y1 + (self.y2 - self.y1) * t
            offset = random.uniform(-20, 20) if random.random() > 0.3 else 0
            points.append((base_x + offset, base_y))
        
        points.append((self.x2, self.y2))
        
        if len(points) > 1:
            # Lõi sáng
            pygame.draw.lines(self.image, (255, 255, 255, alpha), points, 4)
            # Ánh hào
            pygame.draw.lines(self.image, (self.color[0], self.color[1], self.color[2], alpha // 2), points, 8)
            # Đường viền
            pygame.draw.lines(self.image, (self.color[0], self.color[1], self.color[2], alpha), points, 2)
        
        self.rect = self.image.get_rect()
    
    def update(self):
        self.life -= 1
        self.update_image()
        
        if self.life <= 0:
            self.kill()

class Tornado(pygame.sprite.Sprite):
    def __init__(self, x, y, color=CYAN, radius=80, life=30):
        super().__init__()
        self.x = float(x)
        self.y = float(y)
        self.radius = radius
        self.color = color
        self.life = life
        self.max_life = life
        self.rotation = 0
        self.vx = random.uniform(-2, 2)
        self.vy = random.uniform(-2, 0)
        self.update_image()
    
    def update_image(self):
        alpha = int(255 * (self.life / self.max_life))
        size = int(self.radius * 3)
        self.image = pygame.Surface((size, size), pygame.SRCALPHA)
        center = size // 2
        
        # Vẽ lốc xoáy spirals
        for spiral in range(3):
            spiral_radius = self.radius * (1 - spiral * 0.25)
            for i in range(12):
                angle = (self.rotation + i * 30 + spiral * 120) * math.pi / 180
                x1 = center + math.cos(angle) * spiral_radius
                y1 = center + math.sin(angle) * spiral_radius
                
                angle2 = (self.rotation + (i + 1) * 30 + spiral * 120) * math.pi / 180
                x2 = center + math.cos(angle2) * spiral_radius
                y2 = center + math.sin(angle2) * spiral_radius
                
                brightness = int(255 * (1 - spiral * 0.3))
                color_mod = (min(255, self.color[0] + brightness // 3), 
                           min(255, self.color[1] + brightness // 3), 
                           min(255, self.color[2] + brightness // 3), alpha)
                pygame.draw.line(self.image, color_mod, (x1, y1), (x2, y2), 2)
        
        # Particles
        for i in range(8):
            angle = (self.rotation + i * 45) * math.pi / 180
            r = self.radius * 0.7
            x = center + math.cos(angle) * r
            y = center + math.sin(angle) * r
            pygame.draw.circle(self.image, (self.color[0], self.color[1], self.color[2], alpha), (int(x), int(y)), 4)
        
        self.rect = self.image.get_rect(center=(int(self.x), int(self.y)))
    
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.rotation += 20
        self.life -= 1
        self.update_image()
        
        if self.life <= 0:
            self.kill()
        
        self.x = max(self.radius, min(SCREEN_WIDTH - self.radius, self.x))
        self.y = max(100, min(SCREEN_HEIGHT - 100, self.y))

class FloatingScore(pygame.sprite.Sprite):
    def __init__(self, x, y, points, color=GOLD):
        super().__init__()
        self.x = float(x)
        self.y = float(y)
        self.points = points
        self.color = color
        self.life = 60
        self.max_life = 60
        self.vy = -2
        self.scale = 1.0
        self.update_image()
    
    def update_image(self):
        alpha = int(255 * (self.life / self.max_life))
        text = str(self.points)
        text_surface = font.render(text, True, self.color)
        
        # Scale effect
        if self.life > self.max_life * 0.8:
            self.scale = 1.2 - (self.max_life - self.life) / (self.max_life * 0.2) * 0.2
        
        scaled_surface = pygame.transform.scale(text_surface, 
            (int(text_surface.get_width() * self.scale), 
             int(text_surface.get_height() * self.scale)))
        
        self.image = pygame.Surface((scaled_surface.get_width() + 15, scaled_surface.get_height() + 15), pygame.SRCALPHA)
        
        # Glow
        pygame.draw.rect(self.image, (*self.color, alpha // 3), 
                        (0, 0, self.image.get_width(), self.image.get_height()), 3, 8)
        
        self.image.blit(scaled_surface, (7, 7))
        self.rect = self.image.get_rect(center=(int(self.x), int(self.y)))
    
    def update(self):
        self.y += self.vy
        self.life -= 1
        self.update_image()
        
        if self.life <= 0:
            self.kill()

class Fish(pygame.sprite.Sprite):
    def __init__(self, x, y, fish_type=1, level=Level.OCEAN):
        super().__init__()
        self.fish_type = fish_type
        self.level = level
        
        if fish_type == 1:
            self.radius = 12
            self.points = 50
            self.speed = random.uniform(1.5, 2.5)
            self.health = 1
            self.max_health = 1
        elif fish_type == 2:
            self.radius = 22
            self.points = 150
            self.speed = random.uniform(1, 1.8)
            self.health = 2
            self.max_health = 2
        elif fish_type == 3:
            self.radius = 32
            self.points = 400
            self.speed = random.uniform(0.7, 1.2)
            self.health = 3
            self.max_health = 3
        else:
            self.radius = 40
            self.points = 1500
            self.speed = random.uniform(0.5, 0.9)
            self.health = 5
            self.max_health = 5
        
        self.set_color_by_level()
        self.draw_fish()
        self.rect = self.image.get_rect(center=(x, y))
        self.x = float(x)
        self.y = float(y)
        
        self.direction = random.choice([-1, 1])
        self.vx = self.speed * self.direction
        self.vy = random.uniform(-0.5, 0.5)
        self.hit_time = 0
        self.wave_offset = random.uniform(0, 2 * math.pi)
    
    def set_color_by_level(self):
        if self.level == Level.OCEAN:
            colors = [GOLD, CYAN, RED, PURPLE]
        elif self.level == Level.LAVA:
            colors = [YELLOW, ORANGE, RED, DARK_RED]
        elif self.level == Level.ICE:
            colors = [LIGHT_BLUE, CYAN, WHITE, BLUE]
        elif self.level == Level.SPACE:
            colors = [PURPLE, PINK, YELLOW, LIME]
        else:
            colors = [PURPLE, PINK, GOLD, WHITE]
        
        self.color = colors[self.fish_type - 1]
    
    def draw_fish(self):
        size = self.radius * 2
        self.image = pygame.Surface((size, size), pygame.SRCALPHA)
        
        # Thân cá
        pygame.draw.circle(self.image, self.color, (self.radius, self.radius), self.radius)
        
        # Gradient effect
        for i in range(3):
            r = self.radius - i * 3
            if r > 0:
                alpha = 50 - i * 15
                color_lighter = tuple(min(255, c + 30) for c in self.color)
                pygame.draw.circle(self.image, (*color_lighter, alpha), (self.radius, self.radius), r, 1)
        
        # Mắt
        eye_color = BLACK if self.fish_type == 1 else WHITE
        pygame.draw.circle(self.image, eye_color, (self.radius + 5, self.radius - 5), 3)
        pygame.draw.circle(self.image, WHITE, (self.radius + 6, self.radius - 6), 1)
        
        # Đuôi
        if self.fish_type >= 3:
            tail_color = tuple(min(255, c + 50) for c in self.color)
            pygame.draw.polygon(self.image, tail_color, 
                              [(self.radius - 10, self.radius - 8), 
                               (self.radius - 10, self.radius + 8), 
                               (self.radius - 22, self.radius)])
    
    def update(self):
        self.x += self.vx
        self.y += self.vy + math.sin(self.wave_offset) * 0.5
        self.wave_offset += 0.05
        
        if self.x - self.radius <= 0 or self.x + self.radius >= SCREEN_WIDTH:
            self.vx = -self.vx
            self.direction = -self.direction
        if self.y - self.radius <= 80 or self.y + self.radius >= SCREEN_HEIGHT - 80:
            self.vy = -self.vy
        
        self.x = max(self.radius, min(SCREEN_WIDTH - self.radius, self.x))
        self.y = max(80 + self.radius, min(SCREEN_HEIGHT - 80 - self.radius, self.y))
        
        angle = -90 if self.direction > 0 else 90
        rotated_image = pygame.transform.rotate(self.image, angle)
        self.rect = rotated_image.get_rect(center=(int(self.x), int(self.y)))
        self.image = rotated_image
        
        self.hit_time = max(0, self.hit_time - 1)
    
    def take_damage(self, damage=1):
        self.health -= damage
        self.hit_time = 5
        return self.health <= 0

class Fairy(pygame.sprite.Sprite):
    def __init__(self, x, y, level=Level.OCEAN):
        super().__init__()
        self.radius = 18
        self.points = 300
        self.speed = random.uniform(2, 3)
        self.level = level
        
        self.set_color_by_level()
        self.draw_fairy()
        self.rect = self.image.get_rect(center=(x, y))
        self.x = float(x)
        self.y = float(y)
        
        self.direction = random.choice([-1, 1])
        self.vx = self.speed * self.direction
        self.vy = random.uniform(-1, 1)
        self.wing_angle = 0
    
    def set_color_by_level(self):
        if self.level == Level.OCEAN:
            self.color = PINK
        elif self.level == Level.LAVA:
            self.color = ORANGE
        elif self.level == Level.ICE:
            self.color = CYAN
        elif self.level == Level.SPACE:
            self.color = PINK
        else:
            self.color = GOLD
    
    def draw_fairy(self):
        size = self.radius * 2
        self.image = pygame.Surface((size, size), pygame.SRCALPHA)
        
        # Thân
        pygame.draw.circle(self.image, self.color, (self.radius, self.radius), self.radius)
        
        # Cánh
        wing_color = tuple(min(255, c + 100) for c in self.color)
        pygame.draw.circle(self.image, (*wing_color, 150), (self.radius - 10, self.radius - 12), 7)
        pygame.draw.circle(self.image, (*wing_color, 150), (self.radius + 10, self.radius - 12), 7)
        
        # Mắt
        pygame.draw.circle(self.image, BLACK, (self.radius + 4, self.radius - 2), 2)
        pygame.draw.circle(self.image, WHITE, (self.radius + 5, self.radius - 3), 1)
        
        # Glow
        pygame.draw.circle(self.image, (*self.color, 50), (self.radius, self.radius), self.radius + 2, 1)
    
    def update(self):
        self.x += self.vx
        self.y += self.vy + math.sin(self.wing_angle) * 0.3
        self.wing_angle += 0.1
        
        if self.x - self.radius <= 0 or self.x + self.radius >= SCREEN_WIDTH:
            self.vx = -self.vx
            self.direction = -self.direction
        if self.y - self.radius <= 80 or self.y + self.radius >= SCREEN_HEIGHT - 80:
            self.vy = -self.vy
        
        self.x = max(self.radius, min(SCREEN_WIDTH - self.radius, self.x))
        self.y = max(80 + self.radius, min(SCREEN_HEIGHT - 80 - self.radius, self.y))
        
        angle = -90 if self.direction > 0 else 90
        rotated_image = pygame.transform.rotate(self.image, angle)
        self.rect = rotated_image.get_rect(center=(int(self.x), int(self.y)))
        self.image = rotated_image

class Dragon(pygame.sprite.Sprite):
    def __init__(self, x, y, level=Level.OCEAN):
        super().__init__()
        self.radius = 60
        self.level = level
        self.points = 5000
        self.speed = 3.5
        
        self.set_stats_by_level()
        self.draw_dragon()
        self.rect = self.image.get_rect(center=(x, y))
        self.x = float(x)
        self.y = float(y)
        
        self.direction = random.choice([-1, 1])
        self.vx = self.speed * self.direction
        self.vy = random.uniform(-1.5, 1.5)
        self.health = self.max_health
        self.hit_time = 0
        
        self.lightning_cooldown = 0
        self.tornado_cooldown = 0
        self.dash_cooldown = 0
        self.attack_pattern = 0
        self.pattern_timer = 0
        
        self.is_dashing = False
        self.dash_time = 0
        self.glow_intensity = 0
    
    def set_stats_by_level(self):
        if self.level == Level.OCEAN:
            self.color = PURPLE
            self.max_health = 15
            self.points = 5000
            self.lightning_color = LIGHT_BLUE
            self.tornado_color = CYAN
        elif self.level == Level.LAVA:
            self.color = ORANGE
            self.max_health = 20
            self.points = 7500
            self.lightning_color = ORANGE
            self.tornado_color = RED
            self.speed = 4
        elif self.level == Level.ICE:
            self.color = CYAN
            self.max_health = 18
            self.points = 6500
            self.lightning_color = LIGHT_BLUE
            self.tornado_color = CYAN
        elif self.level == Level.SPACE:
            self.color = PURPLE
            self.max_health = 22
            self.points = 8000
            self.lightning_color = PINK
            self.tornado_color = PURPLE
            self.speed = 4.5
        else:
            self.color = GOLD
            self.max_health = 25
            self.points = 10000
            self.lightning_color = GOLD
            self.tornado_color = PURPLE
            self.speed = 5
    
    def draw_dragon(self):
        size = self.radius * 2
        self.image = pygame.Surface((size, size), pygame.SRCALPHA)
        
        # Thân
        pygame.draw.circle(self.image, self.color, (self.radius, self.radius), self.radius)
        
        # Gradient
        pygame.draw.circle(self.image, (*self.color, 80), (self.radius, self.radius), self.radius + 3, 2)
        
        # Sừng
        pygame.draw.polygon(self.image, RED, 
                          [(self.radius - 12, self.radius - self.radius + 8), 
                           (self.radius - 5, self.radius - self.radius - 5), 
                           (self.radius, self.radius - self.radius + 8)])
        pygame.draw.polygon(self.image, RED, 
                          [(self.radius + 12, self.radius - self.radius + 8), 
                           (self.radius + 5, self.radius - self.radius - 5), 
                           (self.radius, self.radius - self.radius + 8)])
        
        # Mắt
        pygame.draw.circle(self.image, GOLD, (self.radius + 12, self.radius - 10), 6)
        pygame.draw.circle(self.image, BLACK, (self.radius + 14, self.radius - 10), 3)
        pygame.draw.circle(self.image, WHITE, (self.radius + 15, self.radius - 11), 1)
        
        # Miệng
        pygame.draw.line(self.image, RED, (self.radius + 18, self.radius - 2), (self.radius + 30, self.radius), 3)
        pygame.draw.line(self.image, RED, (self.radius + 18, self.radius + 2), (self.radius + 30, self.radius), 3)
        
        # Lửa
        pygame.draw.polygon(self.image, YELLOW, 
                          [(self.radius + 28, self.radius - 8), 
                           (self.radius + 40, self.radius), 
                           (self.radius + 28, self.radius + 8)])
        pygame.draw.polygon(self.image, ORANGE, 
                          [(self.radius + 30, self.radius - 5), 
                           (self.radius + 38, self.radius), 
                           (self.radius + 30, self.radius + 5)])
    
    def update(self):
        if self.is_dashing:
            self.dash_time -= 1
            if self.dash_time <= 0:
                self.is_dashing = False
                self.vx = self.speed * self.direction
        
        self.x += self.vx
        self.y += self.vy + math.sin(pygame.time.get_ticks() * 0.005) * 0.3
        
        if self.x - self.radius <= 0 or self.x + self.radius >= SCREEN_WIDTH:
            self.vx = -self.vx
            self.direction = -self.direction
        if self.y - self.radius <= 100 or self.y + self.radius >= SCREEN_HEIGHT - 100:
            self.vy = -self.vy
        
        self.x = max(self.radius, min(SCREEN_WIDTH - self.radius, self.x))
        self.y = max(100 + self.radius, min(SCREEN_HEIGHT - 100 - self.radius, self.y))
        
        angle = -90 if self.direction > 0 else 90
        rotated_image = pygame.transform.rotate(self.image, angle)
        self.rect = rotated_image.get_rect(center=(int(self.x), int(self.y)))
        self.image = rotated_image
        
        self.hit_time = max(0, self.hit_time - 1)
        
        self.lightning_cooldown = max(0, self.lightning_cooldown - 1)
        self.tornado_cooldown = max(0, self.tornado_cooldown - 1)
        self.dash_cooldown = max(0, self.dash_cooldown - 1)
        self.pattern_timer += 1
        
        self.use_skills()
    
    def use_skills(self):
        if self.pattern_timer % 120 == 0:
            self.attack_pattern = random.choice([1, 2, 3])
        
        if self.attack_pattern == 1 and self.lightning_cooldown == 0:
            self.create_lightning()
            self.lightning_cooldown = 60
        
        elif self.attack_pattern == 2 and self.tornado_cooldown == 0:
            self.create_tornado()
            self.tornado_cooldown = 80
        
        elif self.attack_pattern == 3 and self.dash_cooldown == 0:
            self.dash()
            self.dash_cooldown = 100
    
    def create_lightning(self):
        player_x = SCREEN_WIDTH // 2
        player_y = SCREEN_HEIGHT - 50
        
        lightning = Lightning(self.x, self.y, player_x, player_y, self.lightning_color, 10)
        lightnings.add(lightning)
    
    def create_tornado(self):
        for _ in range(2):
            angle = random.uniform(0, 2 * math.pi)
            x = self.x + math.cos(angle) * 100
            y = self.y + math.sin(angle) * 100
            tornado = Tornado(x, y, self.tornado_color, 60, 40)
            tornados.add(tornado)
    
    def dash(self):
        self.is_dashing = True
        self.dash_time = 30
        self.vx = self.speed * 2.5 * self.direction
    
    def take_damage(self, damage=1):
        self.health -= damage
        self.hit_time = 5
        
        if not self.is_dashing and random.random() > 0.5:
            self.dash()
        
        for _ in range(5):
            particle = Particle(self.x, self.y, self.color, 25, size=random.randint(5, 10))
            particles.add(particle)
        
        return self.health <= 0

class Bullet(pygame.sprite.Sprite):
    def __init__(self, x, y, angle):
        super().__init__()
        self.radius = 6
        self.image = pygame.Surface((self.radius * 2, self.radius * 2), pygame.SRCALPHA)
        
        # Ngoại hình đạn
        pygame.draw.circle(self.image, GOLD, (self.radius, self.radius), self.radius)
        pygame.draw.circle(self.image, YELLOW, (self.radius, self.radius), self.radius - 1)
        pygame.draw.circle(self.image, WHITE, (self.radius - 1, self.radius - 1), 1)
        
        self.rect = self.image.get_rect(center=(x, y))
        self.x = float(x)
        self.y = float(y)
        self.speed = 14
        self.vx = math.cos(angle) * self.speed
        self.vy = math.sin(angle) * self.speed
    
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.rect.center = (int(self.x), int(self.y))
        
        if self.x < 0 or self.x > SCREEN_WIDTH or self.y < 0 or self.y > SCREEN_HEIGHT:
            self.kill()

class Gun(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.width = 35
        self.height = 75
        self.image = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        
        # Súng
        pygame.draw.rect(self.image, GOLD, (5, 10, 25, 50), 0, 3)
        pygame.draw.rect(self.image, YELLOW, (7, 12, 21, 46), 0, 2)
        
        # Nòng
        pygame.draw.rect(self.image, RED, (8, 0, 19, 12), 0, 2)
        pygame.draw.circle(self.image, RED, (17, 0), 8)
        pygame.draw.circle(self.image, ORANGE, (17, 0), 5)
        
        # Gốc
        pygame.draw.circle(self.image, GOLD, (17, 60), 10)
        pygame.draw.circle(self.image, YELLOW, (17, 60), 7)
        
        self.rect = self.image.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50))
        self.angle = 0
    
    def update(self):
        mouse_x, mouse_y = pygame.mouse.get_pos()
        gun_x, gun_y = self.rect.center
        
        self.angle = math.atan2(mouse_y - gun_y, mouse_x - gun_x) - math.pi / 2
        
        rotated_image = pygame.transform.rotate(self.image, -math.degrees(self.angle))
        old_center = self.rect.center
        self.image = rotated_image
        self.rect = self.image.get_rect(center=old_center)
    
    def shoot(self):
        gun_x, gun_y = self.rect.center
        bullet = Bullet(gun_x, gun_y - 40, self.angle)
        bullets.add(bullet)
        
        # Tạo hiệu ứng phóng
        for _ in range(3):
            particle = Particle(gun_x, gun_y - 35, ORANGE, 15, 
                              random.uniform(-2, 2), random.uniform(-3, -1))
            particles.add(particle)

# Nhóm sprites
fishes = pygame.sprite.Group()
fairies = pygame.sprite.Group()
dragons = pygame.sprite.Group()
bullets = pygame.sprite.Group()
particles = pygame.sprite.Group()
floating_scores = pygame.sprite.Group()
lightnings = pygame.sprite.Group()
tornados = pygame.sprite.Group()
gun_group = pygame.sprite.Group()

gun = Gun()
gun_group.add(gun)

# Biến toàn cục
score = 0
combo = 0
combo_timer = 0
level = Level.OCEAN
wave = 0
bullets_fired = 0
game_time = 0
boss_spawned = False
player_health = 3
current_level_time = 0
level_duration_frames = 5 * 60 * 60

level_themes = {
    Level.OCEAN: {
        "name": "BIỂN XANH",
        "bg_color": (30, 100, 200),
        "accent_color": (0, 200, 255),
        "accent_color2": (100, 150, 255)
    },
    Level.LAVA: {
        "name": "NÚI CỐC LỬA",
        "bg_color": (150, 50, 0),
        "accent_color": (255, 100, 0),
        "accent_color2": (255, 50, 0)
    },
    Level.ICE: {
        "name": "QUỐC ĐẢO ĐÁ",
        "bg_color": (100, 150, 200),
        "accent_color": (150, 200, 255),
        "accent_color2": (200, 230, 255)
    },
    Level.SPACE: {
        "name": "VŨ TRỤ",
        "bg_color": (20, 10, 50),
        "accent_color": (200, 100, 255),
        "accent_color2": (150, 50, 200)
    },
    Level.VOID: {
        "name": "HỖNĐOẠN",
        "bg_color": (50, 0, 100),
        "accent_color": (255, 200, 0),
        "accent_color2": (200, 100, 255)
    }
}

transition = TransitionEffect(100)

def get_current_level():
    idx = min(4, (score // 5000))
    return [Level.OCEAN, Level.LAVA, Level.ICE, Level.SPACE, Level.VOID][idx]

def spawn_wave():
    global wave, level, boss_spawned
    wave += 1
    level = get_current_level()
    
    if wave % 5 == 0 and wave > 0:
        boss_spawned = True
        dragon = Dragon(SCREEN_WIDTH // 2, 150, level)
        dragons.add(dragon)
    else:
        boss_spawned = False
    
    if not boss_spawned:
        fish_count = 4 + (wave // 3)
    else:
        fish_count = 2
    
    for _ in range(fish_count):
        rand = random.random()
        if rand < 0.5:
            fish_type = 1
        elif rand < 0.7:
            fish_type = 2
        elif rand < 0.85:
            fish_type = 3
        else:
            fish_type = 4
        
        fish = Fish(
            random.randint(50, SCREEN_WIDTH - 50),
            random.randint(120, SCREEN_HEIGHT - 120),
            fish_type,
            level
        )
        fishes.add(fish)
    
    if wave > 1:
        fairy_count = (wave // 3) + 1
        for _ in range(fairy_count):
            fairy = Fairy(
                random.randint(50, SCREEN_WIDTH - 50),
                random.randint(120, SCREEN_HEIGHT - 120),
                level
            )
            fairies.add(fairy)

spawn_wave()

running = True

while running:
    clock.tick(FPS)
    current_level_time += 1
    game_time += 1
    combo_timer = max(0, combo_timer - 1)
    
    transition.update()
    
    # Kiểm tra chuyển màn
    if current_level_time >= level_duration_frames:
        transition.start()
        current_level_time = 0
        level = get_current_level()
        
        fishes.empty()
        fairies.empty()
        dragons.empty()
        bullets.empty()
        particles.empty()
        floating_scores.empty()
        lightnings.empty()
        tornados.empty()
        
        wave = 0
        spawn_wave()
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.MOUSEBUTTONDOWN:
            gun.shoot()
            bullets_fired += 1

    gun_group.update()
    fishes.update()
    fairies.update()
    dragons.update()
    bullets.update()
    particles.update()
    floating_scores.update()
    lightnings.update()
    tornados.update()
    
    # Va chạm
    for bullet in list(bullets):
        hit_fishes = pygame.sprite.spritecollide(bullet, fishes, False)
        if hit_fishes:
            bullet.kill()
            for fish in hit_fishes:
                if fish.take_damage(1):
                    points = fish.points
                    if combo > 0:
                        points = int(points * (1 + combo * 0.15))
                    score += points
                    combo += 1
                    combo_timer = 90
                    
                    for _ in range(15):
                        particle = Particle(fish.x, fish.y, fish.color, 40, size=random.randint(4, 8))
                        particles.add(particle)
                    
                    float_score = FloatingScore(fish.x, fish.y, points, GOLD)
                    floating_scores.add(float_score)
                    
                    fish.kill()
    
    for bullet in list(bullets):
        hit_fairies = pygame.sprite.spritecollide(bullet, fairies, True)
        if hit_fairies:
            bullet.kill()
            for fairy in hit_fairies:
                points = fairy.points
                if combo > 0:
                    points = int(points * (1 + combo * 0.15))
                score += points
                combo += 1
                combo_timer = 90
                
                for _ in range(20):
                    particle = Particle(fairy.x, fairy.y, fairy.color, 45, size=random.randint(4, 10))
                    particles.add(particle)
                
                float_score = FloatingScore(fairy.x, fairy.y, points, fairy.color)
                floating_scores.add(float_score)
    
    for bullet in list(bullets):
        hit_dragons = pygame.sprite.spritecollide(bullet, dragons, False)
        if hit_dragons:
            bullet.kill()
            for dragon in hit_dragons:
                if dragon.take_damage(1):
                    points = dragon.points
                    if combo > 0:
                        points = int(points * (1 + combo * 0.15))
                    score += points
                    combo += 5
                    combo_timer = 120
                    
                    for _ in range(50):
                        particle = Particle(dragon.x, dragon.y, dragon.color, 50, size=random.randint(5, 12))
                        particles.add(particle)
                    
                    float_score = FloatingScore(dragon.x, dragon.y, points, RED)
                    floating_scores.add(float_score)
                    
                    dragon.kill()
    
    player_rect = pygame.Rect(SCREEN_WIDTH // 2 - 35, SCREEN_HEIGHT - 110, 70, 100)
    for lightning in list(lightnings):
        if player_rect.colliderect(lightning.rect):
            player_health -= 1
            lightning.kill()
            for _ in range(25):
                particle = Particle(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50, LIGHT_BLUE, 35, size=random.randint(3, 8))
                particles.add(particle)
    
    for tornado in list(tornados):
        if player_rect.colliderect(tornado.rect):
            player_health -= 1
            for _ in range(20):
                particle = Particle(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50, CYAN, 30, size=random.randint(3, 8))
                particles.add(particle)
    
    if combo_timer == 0:
        combo = 0
    
    if len(fishes) == 0 and len(fairies) == 0 and len(dragons) == 0:
        spawn_wave()
    
    # Vẽ
    theme = level_themes[level]
    
    # Background gradient
    for y in range(SCREEN_HEIGHT):
        ratio = y / SCREEN_HEIGHT
        r = int(theme["bg_color"][0] * (1 - ratio * 0.5))
        g = int(theme["bg_color"][1] * (1 - ratio * 0.3))
        b = int(theme["bg_color"][2] * (1 - ratio * 0.2))
        pygame.draw.line(screen, (r, g, b), (0, y), (SCREEN_WIDTH, y))
    
    # Nền sóng
    for i in range(0, SCREEN_WIDTH, 40):
        pygame.draw.line(screen, (*theme["accent_color"], 100), (i, 80), (i + 30, 80), 2)
        pygame.draw.line(screen, (*theme["accent_color"], 100), (i, SCREEN_HEIGHT - 80), (i + 30, SCREEN_HEIGHT - 80), 2)
    
    pygame.draw.line(screen, theme["accent_color"], (0, 80), (SCREEN_WIDTH, 80), 4)
    pygame.draw.line(screen, theme["accent_color"], (0, SCREEN_HEIGHT - 80), (SCREEN_WIDTH, SCREEN_HEIGHT - 80), 4)
    
    # Particles
    fishes.draw(screen)
    fairies.draw(screen)
    dragons.draw(screen)
    bullets.draw(screen)
    particles.draw(screen)
    gun_group.draw(screen)
    floating_scores.draw(screen)
    lightnings.draw(screen)
    tornados.draw(screen)
    
    # Boss health bar
    for dragon in dragons:
        health_bar_width = 350
        health_bar_height = 30
        health_bar_x = dragon.rect.centerx - health_bar_width // 2
        health_bar_y = dragon.rect.top - 60
        
        # Background
        pygame.draw.rect(screen, (*DARK_RED, 100), (health_bar_x - 5, health_bar_y - 5, health_bar_width + 10, health_bar_height + 10))
        
        # Viền
        pygame.draw.rect(screen, RED, (health_bar_x, health_bar_y, health_bar_width, health_bar_height), 3, 5)
        
        # Thanh máu
        health_width = (dragon.health / dragon.max_health) * health_bar_width
        pygame.draw.rect(screen, GREEN, (health_bar_x + 2, health_bar_y + 2, health_width - 4, health_bar_height - 4), 0, 4)
        
        # Glow
        pygame.draw.rect(screen, (*GREEN, 50), (health_bar_x + 2, health_bar_y + 2, health_width - 4, health_bar_height - 4), 2, 4)
        
        boss_health_text = small_font.render(f"BOSS: {dragon.health}/{dragon.max_health}", True, WHITE)
        screen.blit(boss_health_text, (health_bar_x, health_bar_y - 35))
    
    # Top UI
    pygame.draw.rect(screen, (*BLACK, 150), (0, 0, SCREEN_WIDTH, 90))
    pygame.draw.line(screen, GOLD, (0, 90), (SCREEN_WIDTH, 90), 3)
    
    # Score
    score_text = huge_font.render(f"{score}", True, GOLD)
    score_rect = score_text.get_rect(topleft=(30, 15))
    pygame.draw.rect(screen, (*GOLD, 20), score_rect.inflate(20, 10), 0, 5)
    screen.blit(score_text, score_rect)
    
    # Level name
    level_name_text = large_font.render(theme["name"], True, theme["accent_color"])
    level_rect = level_name_text.get_rect(topright=(SCREEN_WIDTH - 30, 20))
    screen.blit(level_name_text, level_rect)
    
    # Time
    remaining_time = level_duration_frames - current_level_time
    remaining_seconds = remaining_time // 60
    time_text = large_font.render(f"{remaining_seconds // 60:02d}:{remaining_seconds % 60:02d}", True, WHITE)
    time_rect = time_text.get_rect(center=(SCREEN_WIDTH // 2, 30))
    pygame.draw.rect(screen, (*theme["accent_color"], 30), time_rect.inflate(30, 15), 0, 5)
    screen.blit(time_text, time_rect)
    
    # Combo
    if combo > 0:
        combo_scale = 1.1 if combo > 5 else 1.0
        combo_text = large_font.render(f"COMBO x{combo}", True, RED)
        if combo_scale > 1:
            combo_text = pygame.transform.scale(combo_text, 
                (int(combo_text.get_width() * combo_scale), 
                 int(combo_text.get_height() * combo_scale)))
        combo_rect = combo_text.get_rect(center=(SCREEN_WIDTH // 2, 75))
        pygame.draw.rect(screen, RED, combo_rect.inflate(30, 20), 3, 8)
        screen.blit(combo_text, combo_rect)
    
    # Bottom UI
    pygame.draw.rect(screen, (*BLACK, 150), (0, SCREEN_HEIGHT - 90, SCREEN_WIDTH, 90))
    pygame.draw.line(screen, GOLD, (0, SCREEN_HEIGHT - 90), (SCREEN_WIDTH, SCREEN_HEIGHT - 90), 3)
    
    # Info
    info_text = small_font.render(f"🐟 {len(fishes)}  ✨ {len(fairies)}", True, WHITE)
    screen.blit(info_text, (30, SCREEN_HEIGHT - 75))
    
    # Health
    health_display = "❤ " * player_health
    health_text = small_font.render(health_display, True, RED if player_health == 1 else GREEN)
    health_rect = health_text.get_rect(topright=(SCREEN_WIDTH - 30, SCREEN_HEIGHT - 75))
    screen.blit(health_text, health_rect)
    
    # Boss warning
    if boss_spawned:
        boss_warning = large_font.render("⚡ BOSS RỒNG ⚡", True, RED)
        boss_rect = boss_warning.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50))
        pygame.draw.rect(screen, (*RED, 50), boss_rect.inflate(30, 20), 2, 8)
        screen.blit(boss_warning, boss_rect)
    
    # Transition effect
    transition.draw(screen)
    
    pygame.display.flip()

pygame.quit()
sys.exit()

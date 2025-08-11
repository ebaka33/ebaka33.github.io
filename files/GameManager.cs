using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;
    public int Coins = 0;

    private void Awake()
    {
        Instance = this;
        // MusicManager.Instance.PlayDefaultTrack();
    }

    public void AddCoins(int amount)
    {
        Coins += amount;
        // UIManager.Instance.UpdateCoins(Coins);
    }
}
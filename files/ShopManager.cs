using UnityEngine;

public class ShopManager : MonoBehaviour
{
    public Skin[] bottleSkins;
    public Skin[] braceletSkins;
    public Skin[] tattooSkins;
    public Location[] locations;
    public MusicTrack[] musicTracks;

    public void BuySkin(Skin skin)
    {
        if (GameManager.Instance.Coins >= skin.price)
        {
            GameManager.Instance.Coins -= skin.price;
            skin.Unlock();
        }
    }
}
using UnityEngine;

[System.Serializable]
public class MusicTrack
{
    public string name;
    public int price;
    public bool unlocked;
    public AudioClip clip;

    public void Unlock()
    {
        unlocked = true;
    }
}
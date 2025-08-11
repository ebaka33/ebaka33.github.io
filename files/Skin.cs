using UnityEngine;

[System.Serializable]
public class Skin
{
    public string name;
    public int price;
    public bool unlocked;

    public void Unlock()
    {
        unlocked = true;
        // Apply skin
    }
}
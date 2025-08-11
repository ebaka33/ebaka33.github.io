using UnityEngine;

[System.Serializable]
public class Location
{
    public string name;
    public int price;
    public bool unlocked;
    public GameObject scenePrefab;

    public void Unlock()
    {
        unlocked = true;
        // Load scenePrefab
    }
}
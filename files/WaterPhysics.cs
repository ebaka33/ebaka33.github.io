using UnityEngine;

public class WaterPhysics : MonoBehaviour
{
    public Transform waterSurface;

    public void Simulate()
    {
        // Simple water movement based on bottle rotation
        waterSurface.localPosition = new Vector3(0, Mathf.Sin(Time.time * 2f) * 0.05f, 0);
    }
}
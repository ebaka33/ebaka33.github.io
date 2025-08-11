using UnityEngine;

public class BottleController : MonoBehaviour
{
    public Transform hand;
    public GameObject bottle;
    public WaterPhysics waterPhysics;
    public TrajectoryIndicator trajectoryIndicator;
    public SliderController sliderController;
    public bool canThrow = false;

    private void Update()
    {
        if (canThrow)
        {
            bottle.transform.localRotation = Quaternion.Euler(0, Mathf.Sin(Time.time * 2f) * 10f, 0);
            waterPhysics.Simulate();
            trajectoryIndicator.UpdateLine();
        }
    }

    public void ThrowBottle()
    {
        float successChance = sliderController.GetSuccessValue();
        // Calculate trajectory and chance to land on bottom or neck
        // If landed, GameManager.Instance.AddCoins(GetReward());
        // Animate bottle flight and landing
    }
}
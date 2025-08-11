using UnityEngine;

public class TrajectoryIndicator : MonoBehaviour
{
    public LineRenderer lineRenderer;
    public Transform bottle;
    public Color trajectoryColor = Color.red;
    public int length = 10;

    public void UpdateLine()
    {
        lineRenderer.positionCount = length;
        lineRenderer.startColor = trajectoryColor;
        lineRenderer.endColor = trajectoryColor;

        for (int i = 0; i < length; i++)
        {
            // Simple curve prediction
            lineRenderer.SetPosition(i, bottle.position + bottle.forward * i * 0.2f + Vector3.up * (-0.1f * i * i));
        }
    }
}
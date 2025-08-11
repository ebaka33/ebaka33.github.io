using UnityEngine;

public class PlacementTargets : MonoBehaviour
{
    public Transform[] targets; // столб, стул, ветка, и т.д.

    void OnDrawGizmos()
    {
        foreach (Transform t in targets)
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawSphere(t.position, 0.2f);
        }
    }
}
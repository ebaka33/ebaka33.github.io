using UnityEngine;
using UnityEngine.UI;

public class SliderController : MonoBehaviour
{
    public Slider slider;
    public Image fillImage;

    void Update()
    {
        slider.value = Mathf.PingPong(Time.time, 1f);
        fillImage.color = Color.Lerp(Color.red, Color.green, slider.value);
    }

    public float GetSuccessValue()
    {
        return slider.value;
    }
}
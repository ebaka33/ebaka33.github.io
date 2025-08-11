using UnityEngine;

public class MusicManager : MonoBehaviour
{
    public AudioClip[] tracks;
    public AudioSource audioSource;

    public void PlayTrack(int index)
    {
        audioSource.clip = tracks[index];
        audioSource.Play();
    }

    public void PlayDefaultTrack()
    {
        PlayTrack(0);
    }
}
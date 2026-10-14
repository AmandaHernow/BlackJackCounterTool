package net.hernow.bjcountertool

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var backPressPending = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content)) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(
                systemBars.left,
                systemBars.top,
                systemBars.right,
                systemBars.bottom
            )
            insets
        }

        webView = findViewById(R.id.webview)

        webView.settings.apply {
            javaScriptEnabled      = true
            domStorageEnabled      = true   // enables localStorage (theme preference)
            allowFileAccess        = true
            builtInZoomControls    = false
            displayZoomControls    = false
            setSupportZoom(false)
            loadWithOverviewMode   = true
            useWideViewPort        = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                if (!request.isForMainFrame) return true

                val uri = request.url
                when (uri.scheme?.lowercase()) {
                    "file" -> {
                        if (uri.host != null) return true
                        val page = when (uri.path) {
                            "/android_asset/about.html" -> InfoActivity.PAGE_ABOUT
                            "/android_asset/privacy_policy.html" -> InfoActivity.PAGE_PRIVACY
                            else -> return true
                        }

                        // Keep the counter page alive while the user reads bundled information.
                        startActivity(
                            Intent(this@MainActivity, InfoActivity::class.java)
                                .putExtra(InfoActivity.EXTRA_PAGE, page)
                        )
                        return true
                    }
                    "https" -> {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, uri))
                        } catch (_: ActivityNotFoundException) {
                            // No browser is installed; leave the bundled app open.
                        }
                        return true
                    }
                    "mailto" -> {
                        try {
                            startActivity(Intent(Intent.ACTION_SENDTO, uri))
                        } catch (_: ActivityNotFoundException) {
                            // No email app is installed; leave the bundled app open.
                        }
                        return true
                    }
                }
                // Other schemes and unbundled local files are blocked.
                return true
            }
        }

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl("file:///android_asset/index.html")
        }

        // Close Help first; otherwise leave the counter activity.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (backPressPending) return
                backPressPending = true
                webView.evaluateJavascript(
                    "(function(){var modal=document.getElementById('helpModal');if(modal&&modal.style.display==='flex'){document.getElementById('helpClose').click();return true;}return false;})()"
                ) { closedHelp ->
                    backPressPending = false
                    if (isFinishing || isDestroyed || closedHelp == "true") return@evaluateJavascript
                    if (webView.canGoBack()) webView.goBack() else finish()
                }
            }
        })
    }

    override fun onResume() {
        super.onResume()
        backPressPending = false
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }
}

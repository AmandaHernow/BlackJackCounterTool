package net.hernow.bjcountertool

import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/** Displays only the bundled About and Privacy pages, leaving the counter WebView untouched. */
class InfoActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = false
            domStorageEnabled = false
            allowFileAccess = true
            allowContentAccess = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
        }
        setContentView(webView)

        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(webView)

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
                        when (uri.path) {
                            ABOUT_PATH, PRIVACY_PATH -> return false
                            COUNTER_PATH -> {
                                finish()
                                return true
                            }
                        }
                    }
                    "https" -> {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, uri))
                        } catch (_: ActivityNotFoundException) {
                            // No browser is installed; keep the information page open.
                        }
                        return true
                    }
                    "mailto" -> {
                        try {
                            startActivity(Intent(Intent.ACTION_SENDTO, uri))
                        } catch (_: ActivityNotFoundException) {
                            // No email app is installed; keep the information page open.
                        }
                        return true
                    }
                }
                return true
            }
        }

        val page = when (intent.getStringExtra(EXTRA_PAGE)) {
            PAGE_ABOUT -> ABOUT_PATH
            PAGE_PRIVACY -> PRIVACY_PATH
            else -> null
        }
        if (page == null) {
            finish()
            return
        }

        val restored = savedInstanceState?.let { webView.restoreState(it) }
        if (restored == null) webView.loadUrl("file://$page")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_PAGE = "info_page"
        const val PAGE_ABOUT = "about"
        const val PAGE_PRIVACY = "privacy"

        private const val ABOUT_PATH = "/android_asset/about.html"
        private const val PRIVACY_PATH = "/android_asset/privacy_policy.html"
        private const val COUNTER_PATH = "/android_asset/index.html"
    }
}

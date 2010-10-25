/*  KataSpace
 *  login.js
 *
 *  Copyright (c) 2010, Ewen Cheslack-Postava
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of Sirikata nor the names of its contributors may
 *    be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/** Provides simple UI in the div you provide and gives a callback
 *  when the Login button is clicked.
 */
LoginUI = function(dialog_div, avatars, cb) {
    this.mDialogDiv = dialog_div;
    this.mCallback = cb;
    this.mAvatars = avatars;
    this.mAvatarRadios = [];
    var self = this;

    // Build the entry form
    /// Name label
    var name_label_p = document.createElement('p');
    name_label_p.appendChild( document.createTextNode('Name:'));
    this.mDialogDiv[0].appendChild(name_label_p);
    /// Name entry
    this.mNameEntry = document.createElement('input');
    this.mNameEntry.setAttribute('id', '__login');
    this.mNameEntry.setAttribute('type', 'text');
    this.mNameEntry.setAttribute('size', '33');
    this.mDialogDiv[0].appendChild(this.mNameEntry);
    /// Avatar label
    var avatar_label_p = document.createElement('p');
    avatar_label_p.appendChild( document.createTextNode('Avatar:'));
    this.mDialogDiv[0].appendChild(avatar_label_p);
    /// Avatar images
    var av_imgs_div = document.createElement('div');
    av_imgs_div.setAttribute('id', 'avatar');
    this.mDialogDiv[0].appendChild(av_imgs_div);
    for(var av_idx = 0; av_idx < avatars.length; av_idx++) {
        // Radio button
        var av_radio = document.createElement('input');
        av_radio.setAttribute('id', av_idx.toString());
        av_radio.setAttribute('type', 'radio');
        av_radio.setAttribute('name', 'avatar');
        if (av_idx == 0)
            av_radio.setAttribute('checked', 'true');
        av_imgs_div.appendChild(av_radio);
        this.mAvatarRadios.push(av_radio);
        // Label
        var av_radio_label = document.createElement('label');
        av_radio_label.setAttribute('for', av_idx.toString());
        /// Label image
        var av_radio_img = document.createElement('img');
        av_radio_img.setAttribute('src', avatars[av_idx].preview);
        av_radio_img.setAttribute('width', 100);
        av_radio_img.setAttribute('height', 100);
        av_radio_label.appendChild(av_radio_img);
        av_imgs_div.appendChild(av_radio_label);
    }
    // Make the radio options pretty
    var buttons = $( "#avatar" );
    buttons.buttonset();

    // Finally, turn it into a dialog
    this.mDialogDiv.dialog(
        {
	    resizable: false,
	    modal: false,
            closeOnEscape: false,
            draggable: false,
	    buttons: {
		"Login": function() {
                    self._handleLoginClicked();
		}
	    },
            close: function(event, ui) {
                if (!self.mSafeToClose)
                    self.mDialogDiv.dialog("open");
            },
            width: 400,
            height: 450
	}
    );

    $(window).resize(
        function() {
            self.mDialogDiv.dialog( "option", "position", 'center' );
        }
    );
};

LoginUI.prototype._handleLoginClicked = function() {
    var name = this.mNameEntry.value;

    if (!name || name.length == 0) {
        // FIXME do something to notify the user
        $.jnotify("Please enter a name.", "error", 5000);
        return;
    }

    var avatar_selected = null;
    for(var idx = 0; idx < this.mAvatarRadios.length; idx++)
        if (this.mAvatarRadios[idx].checked)
            avatar_selected = this.mAvatarRadios[idx].id;
    avatar_selected = parseInt(avatar_selected);

    this.mCallback(name, this.mAvatars[avatar_selected]);
    this.mSafeToClose = true;
    this.mDialogDiv.dialog( "close" );
};
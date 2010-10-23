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
LoginUI = function(dialog_div, cb) {
    this.mDialogDiv = dialog_div;
    this.mCallback = cb;
    var self = this;

    // Build the entry form
    var label_p = document.createElement('p');
    label_p.appendChild( document.createTextNode('Name:'));
    this.mDialogDiv[0].appendChild(label_p);

    this.mNameEntry = document.createElement('input');
    this.mNameEntry.setAttribute('id', '__login');
    this.mNameEntry.setAttribute('type', 'text');
    this.mNameEntry.setAttribute('size', '33');
    this.mDialogDiv[0].appendChild(this.mNameEntry);

    // Finally, turn it into a dialog
    this.mDialogDiv.dialog(
        {
	    resizable: false,
	    modal: true,
	    buttons: {
		"Login": function() {
                    self._handleLoginClicked();
		}
	    },
            width: 400,
            height: 240
	}
    );
};

LoginUI.prototype._handleLoginClicked = function() {
    var name = this.mNameEntry.value;

    if (!name || name.length == 0) {
        // FIXME do something to notify the user
        return;
    }

    this.mCallback(name);
    this.mDialogDiv.dialog( "close" );
};
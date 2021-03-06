/**
 * Mumsys_Generic_Manager
 * for MUMSYS Library for Multi User Management System (MUMSYS)
 *
 * @license LGPL Version 3 http://www.gnu.org/licenses/lgpl-3.0.txt
 * @copyright Copyright (c) 2017 by Florian Blasel
 * @author Florian Blasel <flobee.code@gmail.com>
 *
 * @category    Mumsys
 * @package     Js
 * @subpackage  Generic
 */

"use strict";

/**
 * @deprecated Use Generic/Manager/Default.js
 * @since version 3.0.0 
 * 
 * Generic manager (data container and data access handler DAO).
 *
 * Loads lists of items, handles and saves items in a generic way.
 * 
 * @uses jQuery for ajax requests
 * @uses JSONRpc 2.0 API
 * 
 * @param url Location to send post/get requests. Default 'jsonrpc.php'
 */
function Mumsys_Generic_Manager(url = false)
{    
    /**
     * Location to send/get requests results.
     * @private Private property
     * @type {string}
     */
    this.__url = 'jsonrpc.php';
    
    if (url) {
        this.__url = url;
    }
    
    /**
     * List of items.
     * @private Private property
     * @type Array
     */
    this.__itemList = [];

    /**
     * Private flag to detect if loading of data is finished.
     * @private Private property: Use public methodes
     * @type Boolean
     */
    this.__flags = {"isLoaded": false};

    /**
     * Map as memory keeper to speed up item searches
     * @type Object
     */
    this.__map = {};
}


/**
 * Returns the version ID.
 * @returns {String} Version ID
 */
Mumsys_Generic_Manager.prototype.getVersion = function ()
{
    return '3.0.0';
};


/**
 * Create a new generic item by given properties.
 *
 * @param {Object} props Properties to initialize the item
 *
 * @returns {Mumsys_Generic_Item} Generic item object
 */
Mumsys_Generic_Manager.prototype.createItem = function (props)
{
    if (props instanceof Object) {
        return new Mumsys_Generic_Item(props);
    } else {
        var message = 'Invalid properties';
        throw new Error(message);
    }
};


/**
 * Adds a generic item interface to the list of items to work with.
 *
 * @param {Mumsys_Generic_Item} item Generic item to add
 */
Mumsys_Generic_Manager.prototype.addItem = function ( item )
{
    if ( item instanceof Mumsys_Generic_Item )
    {
        var id = item.get( 'id' );

        if ( id !== undefined && this.__map[ id ] !== undefined ) {
            var message = '"id" (' + id + ') is unique and already exists';
            throw new Error( message );
        }

        if ( id !== undefined ) {
            this.__map[ id ] = this.__itemList.length;
        }

        this.__itemList.push( item );
    } else {
        throw new Error( 'Invalid item' );
    }
};


/**
 * Remove an item by given id from memory/ current item list.
 *
 * @param {string|integer} id Unique ID of the item (array index)
 */
Mumsys_Generic_Manager.prototype.removeItem = function ( id )
{
    var _tmp = [];
    var _tmpmap = { };

    for ( var i = 0; i < this.__itemList.length; i++ )
    {
        var itemID = this.__itemList[i].get( 'id' );
        if ( itemID !== id ) {
            _tmp.push( this.__itemList[i] );
            _tmpmap[ itemID ] = i;
        }
    }

    this.__itemList = _tmp;
    this.__map = _tmpmap;
};


/**
 * Returns the list of generic items.
 *
 * @returns {Array} List of Mumsys_Generic_Item items
 */
Mumsys_Generic_Manager.prototype.getItems = function () 
{
    return this.__itemList;
};


/**
 * Returns a generic item by identifier and the expected value.
 * 
 * The first match will return.
 * Alternativly you can also fetch an item by given array index as "idx" for 
 * the key. 
 * Warning: Be sure your data does not contain a idx key/property!
 * Note: Checks are type save! Be sure checking for integer, string...
 *
 * E.g:
 * getItem('idx', 0); // returns the first element of the item list
 * getItem('idx', -1);// returns the last  element of the item list
 * getItem('idx', 1); // returns the item with the internal key = 1
 * getItem('id', 3);  // returns the item with id=3 or undefined if not exists
 *
 * @param {String|integer} key Item property to look for. E.g: 'id'
 * @param {Mixed} value Value you are looking for
 * @param {mixed|null} defreturn Default (null) return value if item was not found
 * 
 * @return {Mumsys_Generic_Item|defreturn} Generic item or undefined for not found
 */
Mumsys_Generic_Manager.prototype.getItem = function ( key, value, defreturn )
{
    if ( key === 'idx' )
    {
        if ( value === -1 )
        {
            if ( ( this.__itemList.length - 1 ) < 0 ) {
                var k = 0;
            } else {
                var k = this.__itemList.length - 1;
            }

            return this.__itemList[ k ];
        } else {
            return this.__itemList[ value ];
        }

        return this.__itemList[ value ];
    }

    if ( key === 'id' && this.__map[ key ] !== undefined ) {
        return this.__itemList[ this.__map[ key ] ];
    }

    for ( var i = 0; i < this.__itemList.length; i++ ) {
        if ( this.__itemList[i].get( key ) === value ) {
            return this.__itemList[i];
        }
    }

    return defreturn;
};


/**
 * Clears the item list buffer.
 */
Mumsys_Generic_Manager.prototype.clear = function ()
{
    this.__itemList = [];
    this.__map = {};
};


/**
 * Returns the status flag if loading of data was successful.
 *
 * @returns {Boolean} true on success or false on failure or on not finished yet
 */
Mumsys_Generic_Manager.prototype.isLoaded = function ()
{
    return this.__flags.isLoaded;
};


/**
 * Loads a list of generic items. Wrapper method for jQuery.ajax()
 *
 * Warning: This methods load records and keeps existing data when loading 
 * again. This can endup in very bad performance which huge lists of data!
 * You may call clear() method befor load again. Also loading duplicate items 
 * will fail if item ID also exists.
 *
 * Parameters must be given like your backend to request the right address, 
 * eg: {"program":"a","controller":"b","action":"c"} or other methodes
 * Server reponse must be a jsonrpc 2.0 result containing the list of items as
 * follow:
 * obj.result.list[ Mumsys_Generic_Item, Mumsys_Generic_Item, ... ]
 *  |    |      |
 *  |    |      + --- array containing objects to be initialised as generic item
 *  |    + ---------- json rpc api "result" property
 *  + --------------- response object
 *
 * Request params to be set:
 * <pre>
 *  - url: {String} Url to request to, Default; 'jsonrpc.php'
 *  - async: {Boolean} Use asyc request or not; Default: true
 *  - type: {String} Request type. Default: 'GET'
 *  - contentType: {String} Default: 'application/json'
 *  - dataType: {String} Default: 'json'
 * </pre>
 * Feel free also to overwrite jQuerys success, error callbacks
 *
 * @param {Object} data Mixed request parameters/ data
 * @param {Object} requestParams Parameters to overwrite the ajax request 
 * defaults or to extend for jQuery.ajax().
 *
 * @return {void}
 * @throws {Exception} On errors in response
 */
Mumsys_Generic_Manager.prototype.loadItems = function ( data, requestParams = false )
{
    /**
     * Request parameters. (finals for the server request)
     * @type {Object} Mixed key/value pairs
     */
    var _reParams;
    var _this = this;
    this.__flags.isLoaded = false;

    var defaultParams = {
        url: this.__url
        , async: true
        , type: 'GET'
        , contentType: 'application/json'
        , dataType: 'json'
        , success: function ( obj )
        {
            Mumsys.checkJsonRpcResponce( obj );

            for ( var i = 0; i < obj.result.list.length; i++ ) {
                _this.addItem( _this.createItem( obj.result.list[i] ) );
            }
            _this.__flags.isLoaded = true;
        }
        , error: function ( obj/*, textStatus, errorThrown */ )
        {
            Mumsys.checkJsonRpcResponce( obj );
        }
    };

    _reParams = this._buildParams( defaultParams, data, requestParams );

    jQuery.ajax( _reParams ).done( function ( obj ) {
        Mumsys.checkJsonRpcResponce( obj );
    } );
};


/**
 * Save a generic item.
 *
 * Note: the backend must check the "item" parameter where the item properties 
 * will be set to.
 *
 * default request parameters:
 * <pre>
 *  - url: {String} Url to request to, Default; 'jsonrpc.php'
 *  - type: {String} Request type. Default: 'POST'
 *  - error: {function} Callback for errors
 * </pre>
 *
 * @param {Mumsys_Generic_Item} item Generic item object
 * @param {Object} params Request parameters to the server
 * @param {Object} requestParams Parameters to overwrite the ajax request defaults of jQuery.
 *
 * @returns {Object} Returns the updated generic item
 *
 * @throws {Exception} If json response is in error
 */
Mumsys_Generic_Manager.prototype.saveItem = function ( item, params, requestParams = false )
{
    if ( params.item !== undefined ) {
        var message = 'params.item property already defined';
        throw new Error( message );
    }

    if ( item.isModified() )
    {
        params.item = item.getProperties();

        var defaultParams = {
            url: this.__url
            , type: 'POST'
            , fail: function ( obj, textStatus, errorThrown )
                {
                    console.log( "fail textStatus", textStatus );
                    console.log( "fail errorThrown", errorThrown );

                    Mumsys.checkJsonRpcResponce( jQuery.parseJSON( obj.responseText ) );
                }
        };

        var reqParams = this._buildParams( defaultParams, params, requestParams );
        jQuery.ajax( reqParams ).done( function ( obj )
            {
                Mumsys.checkJsonRpcResponce( obj );
                if ( obj.result.item.id !== undefined ) {
                    item.set( 'id', obj.result.item.id );
                }
            }
        );

        item.setModified( false );
    }

    return item;
};


/**
 * Returns a build parameter object for the jquery ajax request.
 *
 * @param {object} defaultParams Parameters for the jquery ajax request ($.ajax( params )...)
 * @param {object} dataParams Your data to request or send
 * @param {object} requestParams Parameters to overwrite or reset keys of the default
 * parameters or to add additionals jquery ajax() request can handle.
 *
 * @returns {object} Parameters to be set to the jquery ajax request.
 */
Mumsys_Generic_Manager.prototype._buildParams = function ( defaultParams, dataParams, requestParams )
{
    var obj = {};

    if ( requestParams )
    {
        for ( var keyA in defaultParams )
        {
            if ( requestParams[keyA] === undefined ) {
                obj[keyA] = defaultParams[keyA];
            }
        }
        for ( var keyB in requestParams ) {
            if ( requestParams[keyB] !== null ) {
                obj[keyB] = requestParams[keyB];
            }
        }

    } else {
        obj = defaultParams;
    }

    obj.data = dataParams;

    return obj;
};
